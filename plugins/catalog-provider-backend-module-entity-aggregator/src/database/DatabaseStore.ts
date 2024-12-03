import { Knex } from 'knex';
import { LoggerService } from '@backstage/backend-plugin-api';
import { DatabaseService } from '@backstage/backend-plugin-api';
import { createHash } from 'crypto';
import { EntityRecord } from '../types';
import { randomUUID } from 'crypto';

const TABLE_NAME = 'entityRecords';

export class DatabaseStore {
  private constructor(
    private readonly knex: Knex,
    private readonly logger: LoggerService,
  ) {}

  static async create(db: DatabaseService, logger: LoggerService): Promise<DatabaseStore> {
    const knex = await db.getClient();
    const store = new DatabaseStore(knex, logger);
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
          // Add regex check only for PostgreSQL
          table.raw(
            `ALTER TABLE "${TABLE_NAME}" ADD CONSTRAINT "entityRefFormat" CHECK ("entityRef" ~ '^[a-zA-Z0-9]+:[^/]+/[^/]+$')`
          );
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
      const batchSize = 1000;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // Validate records before insertion
        const validRecords = batch.filter(record => {
          if (!record.entityRef || !this.validateEntityRef(record.entityRef)) {
            this.logger.warn(`Invalid entityRef format: ${record.entityRef}. Must match pattern 'kind:namespace/name'`);
            return false;
          }
          return true;
        });
        
        if (validRecords.length === 0) {
          continue;
        }

        await this.knex.transaction(async trx => {
          const queries = validRecords.map(record => {
            const contentHash = this.computeHash(record);
            
            if (this.knex.client.config.client === 'pg') {
              return this.knex(TABLE_NAME)
                .transacting(trx)
                .insert({
                  id: randomUUID(),
                  dataSource: record.dataSource,
                  entityRef: record.entityRef,
                  metadata: record.metadata,
                  spec: record.spec,
                  priorityScore: record.priorityScore,
                  expirationDate: record.expirationDate,
                  contentHash: contentHash,
                  needsEmit: this.knex.raw(`
                    CASE 
                      WHEN EXISTS (
                        SELECT 1 FROM "${TABLE_NAME}" 
                        WHERE "dataSource" = ? 
                        AND "entityRef" = ? 
                        AND "contentHash" != ?
                      ) THEN true 
                      ELSE false 
                    END
                  `, [record.dataSource, record.entityRef, contentHash])
                })
                .onConflict(['dataSource', 'entityRef'])
                .merge();
            }
            
            return this.knex(TABLE_NAME)
              .transacting(trx)
              .insert({
                id: randomUUID(),
                dataSource: record.dataSource,
                entityRef: record.entityRef,
                metadata: JSON.stringify(record.metadata),
                spec: JSON.stringify(record.spec),
                priorityScore: record.priorityScore,
                expirationDate: record.expirationDate,
                contentHash: contentHash,
                needsEmit: 1
              })
              .onConflict(['dataSource', 'entityRef'])
              .merge();
          });

          await Promise.all(queries);
        });

        this.logger.debug(`Processed ${i + validRecords.length} of ${records.length} records`);
      }
    } catch (error) {
      this.logger.error(`Failed to upsert records: ${error}`);
      throw error;
    }
  }

  async getRecordsToEmit(batchSize: number = 1000): Promise<EntityRecord[]> {
    const needsEmit = this.knex.client.config.client === 'pg' ? true : 1;
    
    // First, get all entityRefs that need emission
    const entityRefsToEmit = await this.knex(TABLE_NAME)
      .where('needsEmit', needsEmit)
      .distinct('entityRef')
      .limit(batchSize)
      .pluck('entityRef');

    if (entityRefsToEmit.length === 0) {
      return [];
    }

    // Then get ALL records for these entityRefs
    const records = await this.knex(TABLE_NAME)
      .whereIn('entityRef', entityRefsToEmit)
      .where(builder => 
        builder
          .whereNull('expirationDate')
          .orWhere('expirationDate', '>', new Date())
      )
      .orderBy(['entityRef', 'priorityScore'])
      .select();

    this.logger.debug(`Found ${records.length} total records for ${entityRefsToEmit.length} entities that need emission`);

    return records.map(record => ({
      ...record,
      metadata: this.parseJsonField(record.metadata),
      spec: this.parseJsonField(record.spec),
    }));
  }

  async markEmitted(entityRefs: string[]): Promise<void> {
    const needsEmit = this.knex.client.config.client === 'pg' ? false : 0;
    const batchSize = 1000;
    for (let i = 0; i < entityRefs.length; i += batchSize) {
      const batch = entityRefs.slice(i, i + batchSize);
      await this.knex(TABLE_NAME)
        .whereIn('entityRef', batch)
        .update({ needsEmit: needsEmit });
    }
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
}