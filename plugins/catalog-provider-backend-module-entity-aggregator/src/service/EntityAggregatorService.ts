import { createServiceRef } from '@backstage/backend-plugin-api';
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
   * Gets records that need to be emitted to the catalog
   */
  getRecordsToEmit(batchSize: number): Promise<EntityRecord[][]>;

  /**
   * Marks records as having been emitted to the catalog
   */
  markEmitted(entityRefs: string[]): Promise<void>;

  /**
   * Gets all records for a specific entity reference
   */
  getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]>;
}

/**
 * Service reference for the entity aggregator service.
 * A single instance of this service is shared across all plugins to provide
 * centralized entity aggregation functionality.
 * 
 * @public
 */
export const entityAggregatorServiceRef = createServiceRef<EntityAggregatorService>({
  id: 'catalog.entityAggregator',
  scope: 'root',
}); 