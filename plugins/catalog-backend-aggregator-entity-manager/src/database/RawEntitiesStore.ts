import { Knex } from 'knex';
import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';
import { EntityRecord } from '../types';
import { createHash, randomUUID } from 'crypto';

const TABLE_NAME = 'unmerged_entity_records';

export class RawEntitiesStore {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<RawEntitiesStore> {
    const knex = await db.getClient();
    const store = new RawEntitiesStore(knex as unknown as Knex, logger);
    await store.setupSchema();
    return store;
  }

  private async setupSchema(): Promise<void> {
    if (!(await this.knex.schema.hasTable(TABLE_NAME))) {
      await this.knex.schema.createTable(TABLE_NAME, table => {
        table.string('id').primary().notNullable();
        table.string('dataSource').notNullable();
        table.string('entityRef', 255).notNullable();
        if (this.knex.client.config.client === 'pg') {
          table.jsonb('metadata').notNullable();
          table.jsonb('spec').notNullable();
        } else {
          table.json('metadata').notNullable();
          table.json('spec').notNullable();
        }
        table.timestamp('expirationDate');
        table.integer('priorityScore').notNullable();
        table.string('contentHash').notNullable();
        table.boolean('updated').notNullable().defaultTo(false);
        table.unique(['dataSource', 'entityRef']);
        table.index('entityRef');
        table.index(['dataSource', 'expirationDate']);
        table.index('updated');
        table.index('contentHash');
      });
    }
  }

  private validateEntityRef(entityRef: string): boolean {
    return /^[a-zA-Z0-9]+:[^/]+\/[^/]+$/.test(entityRef);
  }

  private normalizeEntityRef(entityRef: string): string {
    return entityRef.toLowerCase();
  }

  async upsertRecords(records: EntityRecord[]): Promise<void> {
    if (!records.length) return;
    const validRecords = records
      .filter(r => {
        if (!r.entityRef || !this.validateEntityRef(r.entityRef)) {
          this.logger.warn(`Invalid entityRef format: ${r.entityRef}`);
          return false;
        }
        return true;
      })
      .map(record => ({ ...record, entityRef: this.normalizeEntityRef(record.entityRef) }));
    if (!validRecords.length) return;

    await this.knex.transaction(async trx => {
      if (this.knex.client.config.client === 'pg') {
        await trx(TABLE_NAME)
          .insert(
            validRecords.map(r => ({
              id: randomUUID(),
              dataSource: r.dataSource,
              entityRef: r.entityRef,
              metadata: r.metadata,
              spec: r.spec,
              priorityScore: r.priorityScore,
              expirationDate: r.expirationDate,
              contentHash: this.computeHash(r),
              updated: trx.raw(
                `
                CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM "${TABLE_NAME}" 
                    WHERE "dataSource" = ? 
                    AND "entityRef" = ? 
                    AND "contentHash" != ?
                  ) THEN true 
                  ELSE false 
                END
              `,
                [r.dataSource, r.entityRef, this.computeHash(r)],
              ),
            })),
          )
          .onConflict(['dataSource', 'entityRef'])
          .merge();
      } else {
        await trx(TABLE_NAME)
          .insert(
            validRecords.map(r => ({
              id: randomUUID(),
              dataSource: r.dataSource,
              entityRef: r.entityRef,
              metadata: JSON.stringify(r.metadata),
              spec: JSON.stringify(r.spec),
              priorityScore: r.priorityScore,
              expirationDate: r.expirationDate,
              contentHash: this.computeHash(r),
              updated: 1,
            })),
          )
          .onConflict(['dataSource', 'entityRef'])
          .merge();
      }
    });
  }

  async removeExpiredRecords(): Promise<number> {
    const result = await this.knex(TABLE_NAME)
      .where('expirationDate', '<', new Date())
      .delete();
    this.logger.info(`Removed ${result} expired records from the unmerged entity database`);
    return result;
  }

  async getEntityRecordsByEntityRefs(entityRefs: string[]): Promise<string[]> {
    if (!entityRefs.length) return [];
    const lowerRefs = entityRefs.map(r => r.toLowerCase());
    const rows = await this.knex(TABLE_NAME)
      .whereIn('entityRef', lowerRefs)
      .where(builder =>
        builder.whereNull('expirationDate').orWhere('expirationDate', '>', new Date()),
      )
      .distinct('entityRef');
    return rows.map(r => r.entityRef);
  }

  async getRecordsToEmit(batchSize = 1000): Promise<EntityRecord[][]> {
    const updatedFlag = this.knex.client.config.client === 'pg' ? true : 1;
    const refs = await this.knex(TABLE_NAME)
      .where('updated', updatedFlag)
      .distinct('entityRef')
      .limit(batchSize)
      .pluck('entityRef');
    if (!refs.length) return [];

    const rows = await this.knex(TABLE_NAME)
      .whereIn('entityRef', refs)
      .where(builder =>
        builder.whereNull('expirationDate').orWhere('expirationDate', '>', new Date()),
      )
      .orderBy(['entityRef', 'priorityScore'])
      .select();

    const grouped = rows.reduce((map, r) => {
      const arr = map.get(r.entityRef) || [];
      arr.push({
        ...r,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
        spec: typeof r.spec === 'string' ? JSON.parse(r.spec) : r.spec,
      });
      map.set(r.entityRef, arr);
      return map;
    }, new Map<string, EntityRecord[]>());
    return Array.from(grouped.values());
  }

  async markEmitted(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;
    const updatedFlag = this.knex.client.config.client === 'pg' ? false : 0;
    await this.knex(TABLE_NAME)
      .whereIn('entityRef', entityRefs)
      .update({ updated: updatedFlag });
  }

  async getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]> {
    const ref = this.normalizeEntityRef(entityRef);
    const rows = await this.knex(TABLE_NAME)
      .where('entityRef', ref)
      .where(builder =>
        builder.whereNull('expirationDate').orWhere('expirationDate', '>', new Date()),
      )
      .orderBy('priorityScore', 'desc')
      .select();
    return rows.map(r => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      spec: typeof r.spec === 'string' ? JSON.parse(r.spec) : r.spec,
    }));
  }

  async listEntityRefs(): Promise<Array<{ entityRef: string; dataSourceCount: number }>> {
    const rows = await this.knex(TABLE_NAME)
      .select('entityRef')
      .countDistinct({ dataSourceCount: 'dataSource' })
      .groupBy('entityRef')
      .orderBy('entityRef', 'asc')
      .limit(3000)
      .select<Array<{ entityRef: string; dataSourceCount: string | number }>>();
    return rows.map(r => ({
      entityRef: r.entityRef,
      dataSourceCount: Number(r.dataSourceCount),
    }));
  }

  private computeHash(record: EntityRecord): string {
    const c = JSON.stringify({ metadata: record.metadata, spec: record.spec });
    return createHash('sha256').update(c).digest('hex');
  }
}