import { Knex } from 'knex';
import { LoggerService, DatabaseService, resolvePackagePath } from '@backstage/backend-plugin-api';
import { createHash } from 'crypto';
import { Entity } from '@backstage/catalog-model';
import { stringifyEntityRef } from '@backstage/catalog-model';

import { groupBy } from 'lodash';


/**
 * Represents a row in the staging_entities table
 */
export type EntityFragmentRecord = {
  provider_id: string;
  entity_ref: string;
  kind: string;
  entity_json: string;
  priority: number;
  expires_at?: Date;
  content_hash: string;
  needs_processing: boolean;
};

const TABLE_NAME = 'staging_entity_fragments';

const migrationsDir = resolvePackagePath('@core/plugin-catalog-backend-module-aggregator-entity-manager', 'migrations');

export class EntityFragmentRepository {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<EntityFragmentRepository> {
    const knex = await db.getClient();
    const store = new EntityFragmentRepository(knex as unknown as Knex, logger);
    await knex.migrate.latest({ directory: migrationsDir })
    return store;
  }
  
  private validateEntityRef(entityRef: string): boolean {
    return /^[a-z0-9]+:[a-z0-9-]+\/[a-z0-9-]+$/.test(entityRef.toLowerCase());
  }

  private normalizeEntityRef(entityRef: string): string {
    return entityRef.toLocaleLowerCase();
  }

  async updateOrCreateMany(
    providerId: string,
    entities: Entity[],
    priority: number,
    expiresAt?: Date,
  ): Promise<void> {
    const recordsToInsert = entities
      .map((entity: Entity) => {

          const entityRef = stringifyEntityRef(entity);
          return {
            entityRef: this.normalizeEntityRef(entityRef),
            kind: entity.kind,
            entityJson: JSON.stringify(entity),
          };
      })
      .filter((r): r is { entityRef: string; kind: string; entityJson: string } => r !== null)
      .filter(r => this.validateEntityRef(r.entityRef));

    if (!recordsToInsert.length) return;

    await this.knex.transaction(async trx => {
      if (this.knex.client.config.client === 'pg') {
        await trx(TABLE_NAME)
          .insert(
            recordsToInsert.map(r => ({
              provider_id: providerId,
              entity_ref: r.entityRef,
              kind: r.kind,
              entity_json: r.entityJson,
              priority: priority,
              expires_at: expiresAt,
              content_hash: this.computeHash(r.entityJson),
              needs_processing: trx.raw(
                `
                CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM "${TABLE_NAME}" 
                    WHERE "provider_id" = ? 
                    AND "entity_ref" = ? 
                    AND "content_hash" != ?
                  ) THEN true 
                  ELSE false 
                END
              `,
                [providerId, r.entityRef, this.computeHash(r.entityJson)],
              ),
            })),
          )
          .onConflict(['provider_id', 'entity_ref'])
          .merge();
      } else {
        await trx(TABLE_NAME)
          .insert(
            recordsToInsert.map(r => ({
              provider_id: providerId,
              entity_ref: r.entityRef,
              kind: r.kind,
              entity_json: r.entityJson,
              priority: priority,
              expires_at: expiresAt,
              content_hash: this.computeHash(r.entityJson),
              needs_processing: true,
            })),
          )
          .onConflict(['provider_id', 'entity_ref'])
          .merge();
      }
    });
  }

  async removeExpiredRecords(): Promise<number> {
    const result = await this.knex(TABLE_NAME)
      .where('expires_at', '<', new Date())
      .delete();
    this.logger.info(`Removed ${result} expired records from the unmerged entity database`);
    return result;
  }


  private computeHash(entityJson: string): string {
    return createHash('sha256').update(entityJson).digest('hex');
  }

  async getEntityRecordsByEntityRef(entityRef: string): Promise<EntityFragmentRecord[]> {
    const normalizedRef = this.normalizeEntityRef(entityRef);
    
    const rows = await this.knex(TABLE_NAME)
      .where('entity_ref', normalizedRef)
      .where(builder =>
        builder.whereNull('expires_at').orWhere('expires_at', '>', new Date()),
      )
      .select();

    return rows;
  }

  async listEntityRefs(): Promise<Array<{ entityRef: string; providerCount: number }>> {
    const rows = await this.knex(TABLE_NAME)
      .select('entity_ref')
      .countDistinct({ providerCount: 'provider_id' })
      .groupBy('entity_ref')
      .orderBy('entity_ref', 'asc')
      .limit(3000)
      .select<Array<{ entity_ref: string; providerCount: string | number }>>();
    
    return rows.map(r => ({
      entityRef: r.entity_ref,
      providerCount: Number(r.providerCount),
    }));
  }


async findEntityGroupsByEntityRef(options: {
  kind?: string;
  needsProcessing?: boolean;
  batchSize?: number;
}): Promise<EntityFragmentRecord[][]> {
  const batchSize = options.batchSize ?? 1000;

  // First, find candidate entity_refs that match the filters
  const eligibleEntityRefsQuery = this.knex
    .select('entity_ref')
    .from(TABLE_NAME)
    .where(builder => {
      // Filter by entity kind if specified
      if (options.kind) {
        builder.where('kind', options.kind);
      }

      // Handle needs_processing filter
      if (options.needsProcessing) {
        builder.where('needs_processing', true);
      }

      // Exclude expired records
      builder.where(subBuilder =>
        subBuilder
          .whereNull('expires_at')
          .orWhere('expires_at', '>', new Date())
      );
    })
    .distinct()
    .limit(batchSize);


  // Then fetch all records for the selected entity_refs
  const records = await this.knex(TABLE_NAME)
    .select<EntityFragmentRecord[]>()
    .whereIn(
      'entity_ref',
      this.knex.select('entity_ref').from(eligibleEntityRefsQuery)
    )
    // Apply the same filters to ensure consistency
    .where(builder => {
      if (options.kind) {
        builder.where('kind', options.kind);
      }
      // Ensure we only get current (non-expired) records
      builder.where(subBuilder =>
        subBuilder
          .whereNull('expires_at')
          .orWhere('expires_at', '>', new Date())
      );
    })
    // Sort by entity_ref and priority to maintain grouping order
    .orderBy([
      { column: 'entity_ref', order: 'asc' },
      { column: 'priority', order: 'asc' },
    ]);

  // Group records by entity_ref using lodash for clarity
  const groupedRecords = groupBy(records, 'entity_ref');

  // Convert the grouped object into an array of groups
  return Object.values(groupedRecords);
}

async markAsProcessed(entityRefs: string[]): Promise<void> {
  if (!entityRefs.length) return;
  
  await this.knex.transaction(async trx => {
    await trx(TABLE_NAME)
      .whereIn('entity_ref', entityRefs)
      .update({ 
        needs_processing: this.knex.client.config.client === 'pg' ? false : 0 
      });
  });
}

async getExpiredEntityRefs(kind: string): Promise<string[]> {
  const now = new Date();
  const result = await this.knex
    .select('ef1.entity_ref')
    .from(`${TABLE_NAME} as ef1`)
    .where('ef1.kind', kind)
    .whereNotExists(function() {
      this.select()
        .from(`${TABLE_NAME} as ef2`)
        .whereRaw('ef1.entity_ref = ef2.entity_ref')
        .where(function() {
          this.where('expires_at', '>', now)
            .orWhereNull('expires_at');
        });
    })
    .distinct();

  return result.map(r => r.entity_ref);
}

async removeByEntityRefs(entityRefs: string[]): Promise<void> {
  if (!entityRefs.length) return;

  await this.knex.transaction(async trx => {
    await trx(TABLE_NAME)
      .whereIn('entity_ref', entityRefs)
      .delete();
  });
}
}