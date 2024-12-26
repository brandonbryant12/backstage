import { EntityRecord } from '../types';

/**
 * @public
 */
export interface EntityAggregatorService {
  /**
   * Gets merged records that are ready to be emitted.
   */
  getRecordsToEmit(batchSize: number): Promise<EntityRecord[]>;

  /**
   * Marks records as emitted.
   */
  markEmitted(entityRefs: string[]): Promise<void>;

  /**
   * Gets records for a specific entity reference.
   */
  getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]>;

  /**
   * Lists all entity references in the database along with a count of distinct dataSources.
   */
  listEntityRefs(): Promise<Array<{ entityRef: string; dataSourceCount: number }>>;

  /**
   * Returns the subset of entity refs that do not have a valid (non-expired) record in the aggregator’s data store.
   */
  getInvalidEntityRefs(entityRefs: string[]): Promise<string[]>;
}