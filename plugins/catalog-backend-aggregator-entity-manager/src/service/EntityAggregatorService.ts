import { Entity } from "@backstage/catalog-model"
import { EntityFragmentRecord } from "../database/EntityFragmentRepository"

/**
 * @public
 */
export interface EntityAggregatorService {
  /**
   * add records to the staging database
   */
  updateOrCreateEntityFragments(providerId: string, entities: Entity[], priority: number, expiresAt: Date) : Promise<void>

  /**
   * Get all records for a specific entity reference
   */
  getRecordsByEntityRef(entityRef: string): Promise<EntityFragmentRecord[]>

  /**
   * List all entity refs with their provider counts
   */
  listEntityRefs(): Promise<Array<{ entityRef: string; providerCount: number }>>

  /**
   * Find groups of entity fragments by entity reference
   * @param options - Search options
   * @param options.kind - Filter by entity kind
   * @param options.needsProcessing - If true, only return groups where at least one record needs processing
   * @param options.batchSize - Maximum number of groups to return (default: 1000)
   * @returns Array of entity fragment record groups, where each group contains all records for a single entity ref
   */
  findEntityGroupsByEntityRef(options: {
    kind?: string;
    needsProcessing?: boolean;
    batchSize?: number;
  }): Promise<EntityFragmentRecord[][]>;

  /**
   * Marks the given entity refs as processed
   */
  markEntitiesAsProcessed(entityRefs: string[]): Promise<void>;

  /**
   * Gets entity refs for records that have expired
   */
  getExpiredRecordEntityRefs(kind: string): Promise<string[]>;

  /**
   * Removes all records for the given entity refs
   */
  removeRecords(entityRefs: string[]): Promise<void>;

}