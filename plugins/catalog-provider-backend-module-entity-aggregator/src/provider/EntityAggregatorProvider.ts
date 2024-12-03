import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { Entity, EntityMeta } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import { DataSource } from '../datasources/DataSource';
import { DatabaseStore } from '../database/DatabaseStore';
import { EntityRecord } from '../types';
import { chunk } from 'lodash';
import { JsonObject } from '@backstage/types';

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly dataSources: DataSource[];
  private readonly batchSize = 1000;
  private updateLoopInterval = 10; // 30 seconds
  private isUpdateLoopRunning = false;
  private readonly locationKey: string;

  constructor(
    private readonly name: string,
    private readonly store: DatabaseStore,
    private readonly logger: LoggerService,
    dataSources: DataSource[],
  ) {
    this.dataSources = dataSources;
    this.locationKey = `url:${name}-provider.com`;
  }

  getProviderName(): string {
    return this.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    
    // Initialize each data source
    for (const source of this.dataSources) {
      source.onEntitiesFetched = async (entities) => {
        await this.handleFetchedEntities(source, entities);
      };
      
      await source.initialize();
    }

    // Start the continuous update loop
    this.startUpdateLoop();
  }

  private async handleFetchedEntities(source: DataSource, entities: Entity[]): Promise<void> {
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

  private startUpdateLoop(): void {
    if (this.isUpdateLoopRunning) {
      return;
    }

    this.isUpdateLoopRunning = true;
    this.runUpdateLoop();
  }

  private async runUpdateLoop(): Promise<void> {
    while (this.isUpdateLoopRunning && this.connection) {
      try {
        const loopStartTime = Date.now();
        const processedCount = await this.processUpdatedEntities();
        const loopDuration = Date.now() - loopStartTime;

        if (processedCount > 0) {
          this.logger.info(`Update loop completed`, {
            processedEntities: processedCount,
            durationMs: loopDuration,
            entitiesPerSecond: Math.round((processedCount / loopDuration) * 1000)
          });
        }
      } catch (error) {
        this.logger.error('Error in update loop', error);
      }

      await new Promise(resolve => setTimeout(resolve, this.updateLoopInterval));
    }
  }

  private mergeRecords(records: EntityRecord[]): EntityRecord {
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
  }

  private async processUpdatedEntities(): Promise<number> {
    if (!this.connection) {
      return 0;
    }

    const processStartTime = Date.now();
    
    const entitiesToEmit = await this.store.getRecordsToEmit(this.batchSize);
    if (entitiesToEmit.length === 0) {
      return 0;
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
    }

    const totalDuration = Date.now() - processStartTime;
    this.logger.info(`Entity processing details:`, {
      totalEntities: totalProcessed,
      totalDurationMs: totalDuration,
      mergeTimeMs: mergeTimeTotal,
      emitTimeMs: emitTimeTotal,
      entitiesPerSecond: Math.round((totalProcessed / totalDuration) * 1000),
      batchSize: this.batchSize,
      batchCount: batches.length
    });

    return totalProcessed;
  }

  private getEntityRef(entity: Entity): string {
    return `${entity.kind}:${entity.metadata.namespace || 'default'}/${entity.metadata.name}`;
  }
}