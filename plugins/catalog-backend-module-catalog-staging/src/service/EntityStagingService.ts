export interface StagingEntityInput {
  entityRef: string;
  entityJson: any;
}

export interface MergedEntity {
  [key: string]: any;
}

export interface EntityStagingService {
  /**
   * Upserts multiple records for a single provider with a given priority, optionally specifying TTL.
   * Sets has_delta=true if new or changed.
   */
  upsertRecords(
    providerId: string,
    entities: StagingEntityInput[],
    priority: number,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Retrieves records from one or more providers. If onlyChanged is true, returns all rows for entityRefs
   * that have at least one has_delta=true (but returns all rows for those entityRefs).
   */
  getRecords(options?: {
    providerIds?: string[];
    onlyChanged?: boolean;
    entityRefs?: string[];
    limit?: number;
  }): Promise<Array<{
    provider_id: string;
    entity_ref: string;
    entity_json: any;
    priority: number;
    expires_at?: Date;
    content_hash: string;
    has_delta: boolean;
  }>>;

  /**
   * Clears has_delta for all rows matching the given entityRefs across all providers.
   */
  markProcessed(entityRefs: string[]): Promise<void>;

  /**
   * Removes rows for the given entityRefs across all providers.
   */
  removeRecords(entityRefs: string[]): Promise<void>;

  /**
   * Merges all rows for a given entityRef in priority order, returning a single merged object.
   */
  mergeRecords(entityRef: string): Promise<MergedEntity | null>;

  /**
   * Purges any expired rows from the staging table. Returns the number of removed rows.
   */
  purgeExpiredRecords(): Promise<number>;
}