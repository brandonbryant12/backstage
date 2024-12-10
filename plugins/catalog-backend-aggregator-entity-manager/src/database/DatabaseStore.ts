import { Knex } from 'knex';
import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';
import { JsonObject } from '@backstage/types';
import { EntityRecord } from '../types';
import { createHash, randomUUID } from 'crypto';

const TABLE_NAME = 'entityRecords';

export class DatabaseStore {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<DatabaseStore> {
    const knex = await db.getClient();
    const store = new DatabaseStore(knex as unknown as Knex, logger);
    await store.setupSchema();
    return store;
  }

  private async setupSchema(): Promise<void> {
    if (!(await this.knex.schema.hasTable(TABLE_NAME))) {
      await this.knex.schema.createTable(TABLE_NAME, table => {
        // For both PostgreSQL and SQLite
        table.string('id').primary().notNullable();
        table.string('dataSource').notNullable();
        table.string('entityRef', 255).notNullable();
        
        // JSON fields
        if (this.knex.client.config.client === 'pg') {
          table.jsonb('metadata').notNullable();
          table.jsonb('spec').notNullable();
        } else {
          table.json('metadata').notNullable();
          table.json('spec').notNullable();
        }

        // Timestamps
        table.timestamp('lastTouched').notNullable().defaultTo(this.knex.fn.now());
        table.timestamp('expirationDate');
        
        // Other fields
        table.integer('priorityScore').notNullable();
        table.string('contentHash').notNullable();
        table.boolean('needsEmit').notNullable().defaultTo(false);
        
        // Indexes and constraints
        table.unique(['dataSource', 'entityRef']);
        table.index('entityRef');
        table.index(['dataSource', 'expirationDate']);
        table.index('needsEmit');
        table.index('contentHash');
      });

      this.logger.info(`Created ${TABLE_NAME} table`);
    }
  }

  private validateEntityRef(entityRef: string): boolean {
    return /^[a-zA-Z0-9]+:[^/]+\/[^/]+$/.test(entityRef);
  }

  async upsertRecords(records: EntityRecord[]): Promise<void> {
    try {
      if (records.length === 0) return;

      // Validate records before insertion
      const validRecords = records.filter(record => {
        if (!record.entityRef || !this.validateEntityRef(record.entityRef)) {
          this.logger.warn(`Invalid entityRef format: ${record.entityRef}. Must match pattern 'kind:namespace/name'`);
          return false;
        }
        return true;
      });
      
      if (validRecords.length === 0) {
        return;
      }

      await this.knex.transaction(async trx => {
        if (this.knex.client.config.client === 'pg') {
          // PostgreSQL - use more efficient bulk insert
          await trx(TABLE_NAME)
            .insert(
              validRecords.map(record => ({
                id: randomUUID(),
                dataSource: record.dataSource,
                entityRef: record.entityRef,
                metadata: record.metadata,
                spec: record.spec,
                priorityScore: record.priorityScore,
                expirationDate: record.expirationDate,
                contentHash: this.computeHash(record),
                needsEmit: trx.raw(`
                  CASE 
                    WHEN EXISTS (
                      SELECT 1 FROM "${TABLE_NAME}" 
                      WHERE "dataSource" = ? 
                      AND "entityRef" = ? 
                      AND "contentHash" != ?
                    ) THEN true 
                    ELSE false 
                  END
                `, [record.dataSource, record.entityRef, this.computeHash(record)])
              }))
            )
            .onConflict(['dataSource', 'entityRef'])
            .merge();
        } else {
          // SQLite - bulk insert with JSON stringification
          await trx(TABLE_NAME)
            .insert(
              validRecords.map(record => ({
                id: randomUUID(),
                dataSource: record.dataSource,
                entityRef: record.entityRef,
                metadata: JSON.stringify(record.metadata),
                spec: JSON.stringify(record.spec),
                priorityScore: record.priorityScore,
                expirationDate: record.expirationDate,
                contentHash: this.computeHash(record),
                needsEmit: 1
              }))
            )
            .onConflict(['dataSource', 'entityRef'])
            .merge();
        }
      });

      this.logger.debug(`Processed ${validRecords.length} records in a single transaction`);
    } catch (error) {
      this.logger.error(`Failed to upsert records: ${error}`);
      throw error;
    }
  }

  async getRecordsToEmit(batchSize: number = 1000): Promise<EntityRecord[][]> {
    const needsEmit = this.knex.client.config.client === 'pg' ? true : 1;
    
    // Get entityRefs that need emission
    const entityRefsToEmit = await this.knex(TABLE_NAME)
      .where('needsEmit', needsEmit)
      .distinct('entityRef')
      .limit(batchSize)
      .pluck('entityRef');

    if (entityRefsToEmit.length === 0) {
      return [];
    }

    // Get all valid records for these entityRefs in a single query
    const records = await this.knex(TABLE_NAME)
      .whereIn('entityRef', entityRefsToEmit)
      .where(builder => 
        builder
          .whereNull('expirationDate')
          .orWhere('expirationDate', '>', new Date())
      )
      .orderBy(['entityRef', 'priorityScore'])
      .select();

    // Group records by entityRef
    const recordsByRef = records.reduce((groups, record) => {
      const parsed = {
        ...record,
        metadata: this.parseJsonField(record.metadata),
        spec: this.parseJsonField(record.spec),
      };
      
      const group = groups.get(record.entityRef) || [];
      group.push(parsed);
      groups.set(record.entityRef, group);
      return groups;
    }, new Map<string, EntityRecord[]>());

    this.logger.debug(
      `Found ${records.length} total records grouped into ${recordsByRef.size} entities for emission`,
    );

    return Array.from(recordsByRef.values());
  }

  async markEmitted(entityRefs: string[]): Promise<void> {
    if (entityRefs.length === 0) return;
    
    const needsEmit = this.knex.client.config.client === 'pg' ? false : 0;
    
    await this.knex(TABLE_NAME)
      .whereIn('entityRef', entityRefs)
      .update({ needsEmit });
    
    this.logger.debug(`Marked ${entityRefs.length} entity refs as emitted`);
  }

  async getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]> {
    try {
      const records = await this.knex(TABLE_NAME)
        .where('entityRef', entityRef)
        .where(builder => 
          builder
            .whereNull('expirationDate')
            .orWhere('expirationDate', '>', new Date())
        )
        .orderBy('priorityScore', 'desc')
        .select();

      return records.map(record => ({
        ...record,
        metadata: this.parseJsonField(record.metadata),
        spec: this.parseJsonField(record.spec),
      }));
    } catch (error) {
      this.logger.error(`Failed to get records for ${entityRef}: ${error}`);
      throw error;
    }
  }

  private computeHash(record: EntityRecord): string {
    const content = JSON.stringify({
      metadata: record.metadata,
      spec: record.spec,
    });
    return createHash('sha256').update(content).digest('hex');
  }

  private parseJsonField(field: any): any {
    if (typeof field === 'string') {
      return JSON.parse(field);
    }
    return field;
  }

  async removeExpiredRecords(): Promise<number> {
    try {
      const result = await this.knex(TABLE_NAME)
        .where('expirationDate', '<=', new Date())
        .delete();
      
      if (result > 0) {
        this.logger.info(`Removed ${result} expired records from database`);
      } else {
        this.logger.debug('No expired records to remove');
      }
      
      return result;
    } catch (error) {
      this.logger.error('Failed to remove expired records', error as Error);
      throw error;
    }
  }
}