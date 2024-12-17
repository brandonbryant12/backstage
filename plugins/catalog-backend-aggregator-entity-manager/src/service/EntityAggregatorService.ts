import { DataSource } from '../datasources/DataSource';
import { EntityRecord } from '../types';

/**
 * EntityAggregatorService handles the aggregation of entities from multiple data sources,
 * managing their refresh schedules and cleanup of expired records.
 * 
 * @public
 */
export interface EntityAggregatorService {
  /**
   * Adds a data source to be managed by the aggregator
   */
  addDataSource(source: DataSource): void;

  /**
   * Starts the service, initializing all data source schedules and cleanup tasks
   */
  start(): Promise<void>;

  /**
   * Gets merged records that are ready to be emitted to the catalog.
   * Returns a flat array of merged EntityRecords.
   */
  getRecordsToEmit(batchSize: number): Promise<EntityRecord[]>;

  /**
   * Marks records as having been emitted to the catalog
   */
  markEmitted(entityRefs: string[]): Promise<void>;

  /**
   * Gets all records for a specific entity reference
   */
  getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]>;

  /**
   * Gets raw entities and the merged entity for a given entityRef.
   * Returns { rawEntities: [{ dataSource: string, entity: object }[]], entity: object }.
   */
  getRawEntitiesAndMerged(entityRef: string): Promise<{ rawEntities: { dataSource: string; entity: object }[], entity: object }>;
}