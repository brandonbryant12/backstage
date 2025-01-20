import { Knex } from 'knex';
import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';
import crypto from 'crypto';

/**
 * Represents a row in the staging_entities table
 */
export type StagingRow = {
  provider_id: string;
  entity_ref: string;
  entity_json: any;
  priority: number;
  expires_at?: Date;
  content_hash: string;
  has_delta: boolean;
};

const TABLE_NAME = 'staging_entities';

export class StagingEntitiesStore {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<StagingEntitiesStore> {
    const client = await db.getClient();
    const store = new StagingEntitiesStore(client as Knex, logger);
    await store.setupSchema();
    return store;
  }

  private async setupSchema(): Promise<void> {
    const hasTable = await this.knex.schema.hasTable(TABLE_NAME);
    if (!hasTable) {
      await this.knex.schema.createTable(TABLE_NAME, table => {
        table.string('provider_id').notNullable();
        table.string('entity_ref').notNullable();
        // entity_json stored as JSON or JSONB depending on DB
        if (this.knex.client.config.client === 'pg') {
          table.jsonb('entity_json').notNullable();
        } else {
          table.json('entity_json').notNullable();
        }
        table.integer('priority').notNullable();
        table.timestamp('expires_at').nullable();
        table.string('content_hash').notNullable();
        table.boolean('has_delta').notNullable().defaultTo(true);

        table.primary(['provider_id', 'entity_ref']);
      });
      this.logger.info(`Created table ${TABLE_NAME} for staging entities`);
    }
  }

  /**
   * upsertMultiple
   * 
   * Upserts multiple staging rows for a single provider in bulk.
   * Recomputes contentHash, sets has_delta=true if row is new or hash changes.
   */
  async upsertMultiple(
    providerId: string,
    entities: Array<{
      entityRef: string;
      entityJson: any;
    }>,
    priority: number,
    ttlSeconds?: number,
  ): Promise<void> {
    if (!entities.length) return;

    const updates = entities.map(e => {
      const contentHash = this.computeHash(e.entityJson);
      return {
        provider_id: providerId,
        entity_ref: e.entityRef.toLowerCase(),
        entity_json: e.entityJson,
        priority,
        expires_at: ttlSeconds && ttlSeconds > 0
          ? new Date(Date.now() + ttlSeconds * 1000)
          : null,
        content_hash: contentHash,
      };
    });

    await this.knex.transaction(async trx => {
      for (const row of updates) {
        // Insert or update
        // If content_hash changes => has_delta=true
        // If row doesn't exist => has_delta=true
        await trx(TABLE_NAME)
          .insert({
            ...row,
            has_delta: trx.raw(
              `
              CASE WHEN EXISTS (
                SELECT 1 FROM ${TABLE_NAME}
                WHERE provider_id = ?
                  AND entity_ref = ?
                  AND content_hash <> ?
              ) THEN true ELSE true END
            `,
              [row.provider_id, row.entity_ref, row.content_hash],
            ),
          })
          .onConflict(['provider_id', 'entity_ref'])
          .merge({
            entity_json: row.entity_json,
            priority: row.priority,
            expires_at: row.expires_at,
            content_hash: row.content_hash,
            has_delta: trx.raw(
              `
              CASE WHEN ${TABLE_NAME}.content_hash <> ? THEN true
                   ELSE ${TABLE_NAME}.has_delta END
            `,
              [row.content_hash],
            ),
          });
      }
    });
  }

  /**
   * getRecords
   * 
   * Returns staging rows from given providers, or from all providers if none specified.
   * If onlyChanged=true, returns all rows for any entityRef that has at least 1 row with has_delta=true
   * If entityRefs provided, only those entityRefs are returned (intersection).
   */
  async getRecords(options?: {
    providerIds?: string[];
    onlyChanged?: boolean;
    entityRefs?: string[];
    limit?: number;
  }): Promise<StagingRow[]> {
    const {
      providerIds,
      onlyChanged,
      entityRefs,
      limit,
    } = options || {};

    let query = this.knex<StagingRow>(TABLE_NAME).select('*');

    // if providerIds is provided
    if (providerIds && providerIds.length > 0) {
      query = query.whereIn('provider_id', providerIds);
    }

    // If onlyChanged is true, we gather the set of entityRefs that have at least one has_delta=true
    if (onlyChanged) {
      const subQuery = this.knex(TABLE_NAME)
        .select('entity_ref')
        .where(function qb() {
          if (providerIds && providerIds.length > 0) {
            this.whereIn('provider_id', providerIds);
          }
        })
        .where('has_delta', true);

      query = query.whereIn('entity_ref', subQuery);
    }

    // If entityRefs is provided
    if (entityRefs && entityRefs.length > 0) {
      query = query.whereIn('entity_ref', entityRefs.map(r => r.toLowerCase()));
    }

    // Filter out expired
    query = query.where(function qb() {
      this.whereNull('expires_at').orWhere('expires_at', '>', this.knex.fn.now());
    });

    // Optional limit
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    // Sorting might be optional, we won't do a big default unless you want
    // query = query.orderBy('entity_ref', 'asc');

    return query;
  }

  /**
   * markProcessed
   * 
   * Clears has_delta for all matching entityRefs across all providers.
   */
  async markProcessed(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;

    await this.knex(TABLE_NAME)
      .whereIn('entity_ref', entityRefs.map(ref => ref.toLowerCase()))
      .update({ has_delta: false });
  }

  /**
   * removeRecords
   * 
   * Removes any rows for the given entityRefs across all providers.
   */
  async removeRecords(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;

    await this.knex(TABLE_NAME)
      .whereIn('entity_ref', entityRefs.map(ref => ref.toLowerCase()))
      .delete();
  }

  /**
   * mergeRecords
   * 
   * Gathers all rows for a given entityRef, sorted by priority DESC, merges them into a single entity JSON.
   * This uses a simple union logic for arrays, plus a highest-priority-wins approach for collisions.
   */
  async mergeRecords(entityRef: string): Promise<any> {
    // gather all rows that are not expired
    const rows = await this.knex<StagingRow>(TABLE_NAME)
      .where('entity_ref', entityRef.toLowerCase())
      .where(function qb() {
        this.whereNull('expires_at').orWhere('expires_at', '>', this.knex.fn.now());
      })
      .orderBy('priority', 'desc');

    if (!rows.length) {
      return null;
    }
    // Start with top priority
    let merged = rows[0].entity_json;

    // For each subsequent row (lower priority), do a union of arrays, shallow merges otherwise
    // This is a simplistic approach. You can replace with your own logic if you want
    for (let i = 1; i < rows.length; i++) {
      const nextJson = rows[i].entity_json;
      merged = this.mergeTwo(merged, nextJson);
    }

    return merged;
  }

  private mergeTwo(higher: any, lower: any): any {
    if (Array.isArray(higher) || Array.isArray(lower)) {
      // union arrays
      const arrHigh = Array.isArray(higher) ? higher : [higher];
      const arrLow = Array.isArray(lower) ? lower : [lower];
      return Array.from(new Set([...arrHigh, ...arrLow]));
    } else if (typeof higher === 'object' && typeof lower === 'object') {
      // shallow merge, union arrays
      const result = { ...higher };
      for (const key of Object.keys(lower)) {
        if (!Object.prototype.hasOwnProperty.call(higher, key)) {
          result[key] = lower[key];
        } else {
          result[key] = this.mergeTwo(higher[key], lower[key]);
        }
      }
      return result;
    } else {
      // prefer higher (no override)
      return higher;
    }
  }

  /**
   * INTERNAL: Called on a schedule or by some aggregator logic to remove expired rows.
   */
  async purgeExpired(): Promise<number> {
    const count = await this.knex(TABLE_NAME)
      .whereNotNull('expires_at')
      .where('expires_at', '<', this.knex.fn.now())
      .delete();
    return count;
  }

  private computeHash(entityJson: any): string {
    const str = JSON.stringify(entityJson);
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}