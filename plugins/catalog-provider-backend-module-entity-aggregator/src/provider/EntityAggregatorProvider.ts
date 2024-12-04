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
import { JsonObject } from '@backstage/types';

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly dataSources: DataSource[];
  private readonly batchSize = 1000;
  private readonly locationKey: string;
  private readonly emitSchedule: SchedulerServiceTaskScheduleDefinition = {
    frequency: { seconds: 10 },
    timeout: { minutes: 5 },
  };
  private readonly cleanupSchedule: SchedulerServiceTaskScheduleDefinition = {
    frequency: { seconds: 10 },
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

    // Schedule the cleanup task
    const cleanupRunner = this.scheduler.createScheduledTaskRunner(this.cleanupSchedule);
    await cleanupRunner.run({
      id: `${this.name}-cleanup-expired`,
      fn: async () => {
        try {
          const removedCount = await this.store.removeExpiredRecords();
          if (removedCount > 0) {
            this.logger.info(`Cleanup task completed: removed ${removedCount} expired records`);
          }
        } catch (error) {
          this.logger.error('Failed to cleanup expired records', error as Error);
        }
      },
    });
    this.logger.info(`Scheduled expired records cleanup with schedule: ${JSON.stringify(this.cleanupSchedule)}`);
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
        expirationDate: source instanceof DataSource ? source.getExpirationDate() : undefined,
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
        annotations: {} as Record<string, string>,
      },
    };

    // For each unique annotation key
    const allKeys = new Set(
      sortedRecords.flatMap(r => Object.keys(r.metadata.annotations || {}))
    );

    allKeys.forEach(key => {
      // Find first (highest priority) record that has this annotation
      for (const record of sortedRecords) {
        const annotations = record.metadata.annotations || {};
        if (key in annotations) {
          mergedRecord.metadata.annotations[key] = annotations[key];
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
      const entityGroups = await this.store.getRecordsToEmit(this.batchSize);
      if (entityGroups.length === 0) {
        return;
      }

      const mutations: DeferredEntity[] = [];
      const processedRefs: string[] = [];

      for (const records of entityGroups) {
        if (!records.length) continue;
        
        const entityRef = records[0].entityRef;
        const [kind] = entityRef.split(':');
        
        const mergedRecord = this.mergeRecords(records);
        
        mergedRecord.metadata.annotations = {
          ...mergedRecord.metadata.annotations,
          "backstage.io/managed-by-origin-location": `entityAggregator://${mergedRecord.metadata.name}`,
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
        
        processedRefs.push(entityRef);
      }

      if (mutations.length > 0) {
        await this.connection.applyMutation({
          type: 'delta',
          added: mutations,
          removed: [],
        });

        await this.store.markEmitted(processedRefs);
      }
    } catch (error) {
      this.logger.error('Failed to emit updated entities', error as Error);
    }
  }

  private getEntityRef(entity: Entity): string {
    try {
      return `${entity.kind}:${entity.metadata.namespace || 'default'}/${entity.metadata.name}`;
    } catch (error) {
      this.logger.error(`Failed to generate entityRef for entity`, error as Error);
      return `unknown:default/error-${Date.now()}`;
    }
  }
}