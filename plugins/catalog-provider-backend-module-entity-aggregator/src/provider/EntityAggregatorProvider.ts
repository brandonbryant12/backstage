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

// Common array fields in Backstage entities
const MERGEABLE_ARRAYS = {
  metadata: ['tags', 'links'],
  spec: ['dependsOn', 'consumesApis', 'providesApis', 'ownedBy', 'type', 'targets', 'definition', 'members', 'maintainers', 'parents', 'children', 'substitutes', 'substituteFor', 'subcomponentOf'],
};

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly dataSources: DataSource[];
  private readonly batchSize = 100;
  private updateLoopInterval = 30000; // 30 seconds
  private isUpdateLoopRunning = false;

  constructor(
    private readonly name: string,
    private readonly store: DatabaseStore,
    private readonly logger: LoggerService,
    dataSources: DataSource[],
  ) {
    this.dataSources = dataSources;
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
      this.logger.debug(`Processing ${entities.length} entities from ${source.getName()}`);
      
      const entityRecords: EntityRecord[] = entities.map(entity => ({
        dataSource: source.getName(),
        entityRef: this.getEntityRef(entity),
        metadata: entity.metadata as EntityMeta,
        spec: entity.spec || {} as JsonObject,
        priorityScore: source.getPriority(),
      }));

      await this.store.upsertRecords(entityRecords);
      
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
        await this.processUpdatedEntities();
      } catch (error) {
        this.logger.error('Error in update loop', error);
      }

      await new Promise(resolve => setTimeout(resolve, this.updateLoopInterval));
    }
  }

  private mergeArrayFields(records: EntityRecord[], section: 'metadata' | 'spec', fieldName: string): any[] {
    // Combine arrays from all records and remove duplicates
    const combinedArray = [...new Set(
      records
        .flatMap(record => record[section]?.[fieldName] || [])
        // For objects in arrays (like links), stringify them for deduplication
        .map(item => typeof item === 'object' ? JSON.stringify(item) : item)
    )];

    // Convert stringified objects back to objects
    return combinedArray.map(item => {
      try {
        return typeof item === 'string' && item.startsWith('{') ? JSON.parse(item) : item;
      } catch {
        return item;
      }
    });
  }

  private mergeRecords(records: EntityRecord[]): EntityRecord {
    // Sort by priority score (highest first)
    const sortedRecords = [...records].sort((a, b) => b.priorityScore - a.priorityScore);
    const highestPriorityRecord = sortedRecords[0];

    // Log the starting state
    this.logger.info('Starting merge for records:', {
      entityRef: highestPriorityRecord.entityRef,
      sources: sortedRecords.map(r => ({
        source: r.dataSource,
        priority: r.priorityScore,
        annotations: r.metadata.annotations || {},
      }))
    });

    // Create merged record starting with highest priority record's base data
    const mergedRecord = {
      ...highestPriorityRecord,
      metadata: {
        ...highestPriorityRecord.metadata,
        annotations: {},
      },
      spec: { ...highestPriorityRecord.spec },
    };

    // Merge annotations (priority-based)
    const allAnnotationKeys = new Set(
      sortedRecords.flatMap(r => Object.keys(r.metadata.annotations || {}))
    );

    allAnnotationKeys.forEach(key => {
      // Find first (highest priority) record that has this annotation
      for (const record of sortedRecords) {
        if (record.metadata.annotations?.[key]) {
          mergedRecord.metadata.annotations[key] = record.metadata.annotations[key];
          break;
        }
      }
    });

    // Merge array fields
    for (const [section, fields] of Object.entries(MERGEABLE_ARRAYS)) {
      for (const fieldName of fields) {
        const hasField = sortedRecords.some(r => Array.isArray(r[section]?.[fieldName]));
        if (hasField) {
          const mergedArray = this.mergeArrayFields(sortedRecords, section as 'metadata' | 'spec', fieldName);
          if (mergedArray.length > 0) {
            mergedRecord[section][fieldName] = mergedArray;
            
            // Log the merge result for this field
            this.logger.debug(`Merged ${section}.${fieldName}:`, {
              entityRef: mergedRecord.entityRef,
              field: fieldName,
              sources: sortedRecords.map(r => ({
                source: r.dataSource,
                values: r[section]?.[fieldName] || []
              })),
              result: mergedArray
            });
          }
        }
      }
    }

    // Log the result
    this.logger.info('Merged record result:', {
      entityRef: mergedRecord.entityRef,
      dataSources: sortedRecords.map(r => r.dataSource).join(', '),
      annotations: mergedRecord.metadata.annotations,
      metadata: Object.keys(mergedRecord.metadata).filter(k => Array.isArray(mergedRecord.metadata[k])),
      spec: Object.keys(mergedRecord.spec).filter(k => Array.isArray(mergedRecord.spec[k]))
    });

    return mergedRecord;
  }

  private async processUpdatedEntities(): Promise<void> {
    if (!this.connection) {
      return;
    }

    const entitiesToEmit = await this.store.getRecordsToEmit(this.batchSize);
    if (entitiesToEmit.length === 0) {
      return;
    }

    this.logger.info(`Processing ${entitiesToEmit.length} records that need updates`);
    
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
      
      for (const entityRef of batch) {
        const entityRecords = recordsByRef.get(entityRef);
        if (!entityRecords || entityRecords.length === 0) continue;

        const [kind] = entityRef.split(':');
        const mergedRecord = this.mergeRecords(entityRecords);

        mutations.push({
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind,
            metadata: mergedRecord.metadata,
            spec: mergedRecord.spec,
          },
          locationKey: `${mergedRecord.dataSource}-location`,
        });
      }

      await this.connection.applyMutation({
        type: 'delta',
        added: mutations,
        removed: [],
      });

      await this.store.markEmitted(batch);
      this.logger.info(`Processed batch of ${batch.length} entities`);
    }
  }

  private getEntityRef(entity: Entity): string {
    return `${entity.kind}:${entity.metadata.namespace || 'default'}/${entity.metadata.name}`;
  }
}