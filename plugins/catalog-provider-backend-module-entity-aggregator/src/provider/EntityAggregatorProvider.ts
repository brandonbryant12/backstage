import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { Entity, EntityMeta } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SchedulerService, SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { DataSource } from '../datasources/DataSource';
import { DatabaseStore } from '../database/DatabaseStore';
import { EntityRecord } from '../types';
import { chunk } from 'lodash';
import { JsonObject } from '@backstage/types';

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly dataSources: DataSource[];
  private readonly batchSize = 1000;
  private readonly locationKey: string;
  private readonly emitSchedule: SchedulerServiceTaskScheduleDefinition = {
    frequency: { seconds: 30 },
    timeout: { minutes: 5 },
  };

  constructor(
    private readonly name: string,
    private readonly store: DatabaseStore,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
    dataSources?: DataSource[],
  ) {
    this.dataSources = dataSources || [];
    this.locationKey = `entity-aggregator-provider:id`;
    this.logger.debug(`Initialized with ${this.dataSources.length} data sources`);
  }

  getProviderName(): string {
    return this.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    
    // Initialize data source schedules
    for (const source of this.dataSources) {
      const schedule = source.getSchedule();
      if (schedule) {
        const runner = this.scheduler.createScheduledTaskRunner(schedule);
        await runner.run({
          id: `datasource-refresh-${source.getName()}`,
          fn: async () => {
            await source.refresh(entities => this.provide(source, entities));
          },
        });
        this.logger.info(
          `Scheduled refresh for ${source.getName()} with schedule: ${JSON.stringify(schedule)}`,
        );
      }
    }

    // Schedule the emit task
    const emitRunner = this.scheduler.createScheduledTaskRunner(this.emitSchedule);
    await emitRunner.run({
      id: `${this.name}-emit-updates`,
      fn: async () => {
        await this.emitUpdatedEntities();
      },
    });
    this.logger.info(`Scheduled entity emission with schedule: ${JSON.stringify(this.emitSchedule)}`);
  }

  private async provide(source: DataSource, entities: Entity[]): Promise<void> {
    try {
      this.logger.info(`Starting to process ${entities.length} entities from ${source.getName()}`);
      const entityRecords: EntityRecord[] = entities.map(entity => ({
        dataSource: source.getName(),
        entityRef: this.getEntityRef(entity),
        metadata: entity.metadata as EntityMeta,
        spec: entity.spec || {} as JsonObject,
        priorityScore: source.getPriority(),
      }));
      await this.store.upsertRecords(entityRecords);
      this.logger.info(`Processed ${entities.length} entities from ${source.getName()}`);
      
    } catch (error) {
      this.logger.error(
        `Failed to process entities from ${source.getName()}`,
        error as JsonObject,
      );
    }
  }

  private mergeRecords(records: EntityRecord[]): EntityRecord {
      const sortedRecords = [...records].sort((a, b) => b.priorityScore - a.priorityScore);
      const highestPriorityRecord = sortedRecords[0];

      // Create merged record starting with highest priority record's base data
      const mergedRecord = {
        ...highestPriorityRecord,
        metadata: {
          ...highestPriorityRecord.metadata,
          annotations: {},
        },
      };

      // For each unique annotation key
      const allKeys = new Set(
        sortedRecords.flatMap(r => Object.keys(r.metadata.annotations || {}))
      );

      allKeys.forEach(key => {
        // Find first (highest priority) record that has this annotation
        for (const record of sortedRecords) {
          if (record.metadata.annotations?.[key]) {
            mergedRecord.metadata.annotations[key] = record.metadata.annotations[key];
            break;
          }
        }
      });
      return mergedRecord;
  }

  private async emitUpdatedEntities(): Promise<void> {
    if (!this.connection) {
      this.logger.warn('No connection available, skipping entity emission');
      return;
    }
    
    try {
      const entitiesToEmit = await this.store.getRecordsToEmit(this.batchSize);
      if (entitiesToEmit.length === 0) {
        return;
      }
      const recordsByRef = new Map<string, EntityRecord[]>();
      for (const record of entitiesToEmit) {
        const existing = recordsByRef.get(record.entityRef) || [];
        existing.push(record);
        recordsByRef.set(record.entityRef, existing);
      }

      const entityRefs = Array.from(recordsByRef.keys());
      const batches = chunk(entityRefs, this.batchSize);

      for (const batch of batches) {
        try {
          const mutations: DeferredEntity[] = [];
          for (const entityRef of batch) {
            const entityRecords = recordsByRef.get(entityRef);
            if (!entityRecords || entityRecords.length === 0) continue;

            const [kind] = entityRef.split(':');
            const mergedRecord = this.mergeRecords(entityRecords);
            
            mergedRecord.metadata.annotations = {
              ...mergedRecord.metadata.annotations,
              "backstage.io/managed-by-origin-location" : `entityAggregator://${mergedRecord.metadata.name}`,
              "backstage.io/managed-by-location": `entityAggregator://${mergedRecord.metadata.name}`,
            };

            mutations.push({
              entity: {
                apiVersion: 'backstage.io/v1alpha1',
                kind,
                metadata: mergedRecord.metadata,
                spec: mergedRecord.spec,
              },
              locationKey: this.locationKey,
            });
          }
          await this.connection.applyMutation({
            type: 'delta',
            added: mutations,
            removed: [],
          });

          await this.store.markEmitted(batch);
        } catch (error) {
          this.logger.error(`Failed to process batch of ${batch.length} entities`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to emit updated entities', error);
    }
  }

  private getEntityRef(entity: Entity): string {
    try {
      return `${entity.kind}:${entity.metadata.namespace || 'default'}/${entity.metadata.name}`;
    } catch (error) {
      this.logger.error(`Failed to generate entityRef for entity`, error);
      return `unknown:default/error-${Date.now()}`;
    }
  }
}