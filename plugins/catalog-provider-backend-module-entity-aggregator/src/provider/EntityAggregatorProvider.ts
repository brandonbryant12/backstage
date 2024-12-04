import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { Entity, EntityMeta } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SchedulerService } from '@backstage/backend-plugin-api';
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
  private readonly emitSchedule = '*/10 * * * * *'; // Run every minute by default

  constructor(
    private readonly name: string,
    private readonly store: DatabaseStore,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
    dataSources?: DataSource[],
  ) {
    this.dataSources = dataSources || [];
    this.locationKey = `url:${name}-provider.com`;
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
        try {
          await this.scheduler.scheduleTask({
            id: `datasource-refresh-${source.getName()}`,
            frequency: { cron: schedule },
            timeout: { minutes: 10 },
            fn: async () => {
              await this.refreshDataSource(source);
            },
          });
          this.logger.info(`Scheduled refresh for ${source.getName()} with cron: ${schedule}`);
        } catch (error) {
          this.logger.error(`Failed to schedule refresh for ${source.getName()}`, error);
        }
      }
    }

    // Schedule the emit task
    try {
      await this.scheduler.scheduleTask({
        id: `${this.name}-emit-updates`,
        frequency: { cron: this.emitSchedule },
        timeout: { minutes: 5 },
        fn: async () => {
          await this.emitUpdatedEntities();
        },
      });
      this.logger.info(`Scheduled entity emission with cron: ${this.emitSchedule}`);
    } catch (error) {
      this.logger.error('Failed to schedule entity emission task', error);
    }
  }

  private async refreshDataSource(source: DataSource): Promise<void> {
    const startTime = Date.now();
    this.logger.info(`Starting refresh for ${source.getName()}`);
    
    try {
      await source.refresh(async (entities) => {
        await this.provide(source, entities);
      });
      
      const duration = Date.now() - startTime;
      this.logger.info(`Completed refresh for ${source.getName()}`, {
        source: source.getName(),
        durationMs: duration,
      });
    } catch (error) {
      this.logger.error(
        `Failed to refresh ${source.getName()}`,
        error,
      );
    }
  }

  private async provide(source: DataSource, entities: Entity[]): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.info(`Starting to process ${entities.length} entities from ${source.getName()}`);
      
      const entityRecords: EntityRecord[] = entities.map(entity => ({
        dataSource: source.getName(),
        entityRef: this.getEntityRef(entity),
        metadata: entity.metadata as EntityMeta,
        spec: entity.spec || {} as JsonObject,
        priorityScore: source.getPriority(),
      }));

      await this.store.upsertRecords(entityRecords);
      
      const duration = Date.now() - startTime;
      this.logger.info(`Processed ${entities.length} entities from ${source.getName()} in ${duration}ms`, {
        source: source.getName(),
        entityCount: entities.length,
        durationMs: duration,
        entitiesPerSecond: Math.round((entities.length / duration) * 1000)
      });
      
    } catch (error) {
      this.logger.error(
        `Failed to process entities from ${source.getName()}`,
        error,
      );
    }
  }

  private mergeRecords(records: EntityRecord[]): EntityRecord {
    try {
      const mergeStartTime = Date.now();
      
      // Sort by priority score (highest first)
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

      const mergeDuration = Date.now() - mergeStartTime;
      this.logger.debug(`Merged ${records.length} records in ${mergeDuration}ms`, {
        entityRef: mergedRecord.entityRef,
        recordCount: records.length,
        durationMs: mergeDuration,
        dataSources: sortedRecords.map(r => r.dataSource).join(', ')
      });

      return mergedRecord;
    } catch (error) {
      this.logger.error('Failed to merge records, returning highest priority record', error);
      return records[0];
    }
  }

  private async emitUpdatedEntities(): Promise<void> {
    if (!this.connection) {
      this.logger.warn('No connection available, skipping entity emission');
      return;
    }

    const processStartTime = Date.now();
    
    try {
      const entitiesToEmit = await this.store.getRecordsToEmit(this.batchSize);
      if (entitiesToEmit.length === 0) {
        return;
      }

      let totalProcessed = 0;
      let mergeTimeTotal = 0;
      let emitTimeTotal = 0;
      
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
          
          const mergeStartTime = Date.now();
          for (const entityRef of batch) {
            const entityRecords = recordsByRef.get(entityRef);
            if (!entityRecords || entityRecords.length === 0) continue;

            const [kind] = entityRef.split(':');
            const mergedRecord = this.mergeRecords(entityRecords);
            
            mergedRecord.metadata.annotations = {
              ...mergedRecord.metadata.annotations,
              'backstage.io/managed-by-location': this.locationKey,
              'backstage.io/managed-by-origin-location': this.locationKey,
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
          mergeTimeTotal += Date.now() - mergeStartTime;

          const emitStartTime = Date.now();
          await this.connection.applyMutation({
            type: 'delta',
            added: mutations,
            removed: [],
          });

          await this.store.markEmitted(batch);
          emitTimeTotal += Date.now() - emitStartTime;

          totalProcessed += batch.length;
        } catch (error) {
          this.logger.error(`Failed to process batch of ${batch.length} entities`, error);
          // Continue with next batch despite error
        }
      }

      const totalDuration = Date.now() - processStartTime;
      if (totalProcessed > 0) {
        this.logger.info(`Entity emission completed:`, {
          totalEntities: totalProcessed,
          totalDurationMs: totalDuration,
          mergeTimeMs: mergeTimeTotal,
          emitTimeMs: emitTimeTotal,
          entitiesPerSecond: Math.round((totalProcessed / totalDuration) * 1000),
          batchSize: this.batchSize,
          batchCount: batches.length
        });
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