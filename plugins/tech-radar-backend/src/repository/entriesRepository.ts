import { DatabaseService, resolvePackagePath } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';



export interface TechRadarEntry {
  entry_id: string;
  title: string;
  quadrant_name: string;
  disposition_name: string;
  description?: string; 
  date?: Date;
  url?: string;
}

const TABLE_NAME = 'entries';

export class EntriesRepository {
  private constructor(private readonly db: Knex) {}

  static async create(db: DatabaseService): Promise<EntriesRepository> {
    const knex = await db.getClient();
    const migrationsDir = resolvePackagePath(
        '@internal/plugin-tech-radar-backend',
        'migrations',
    );
    await knex.migrate.latest({
        directory: migrationsDir,
    });

    return new EntriesRepository(knex);
  }

  /**
   * Refreshes all entries in the database within a single transaction.
   * Deletes all existing entries and inserts the provided new entries.
   *
   * @param entries - An array of TechRadarEntry objects to insert.
   */
  async updateAll(entries: TechRadarEntry[]): Promise<void> {
    await this.db.transaction(async (tx: Knex.Transaction) => {
      await tx(TABLE_NAME).del();
      if (entries && entries.length > 0) {
        const entriesToInsert = entries.map(entry => ({
          entry_id: entry.entry_id,
          title: entry.title,
          quadrant_name: entry.quadrant_name,
          disposition_name: entry.disposition_name,
          description: entry.description,
          url: entry.url,
          ...(entry.date && { date: entry.date }),
        }));
        await tx(TABLE_NAME).insert(entriesToInsert);
      }
    });
  }

  async getAllEntries(): Promise<TechRadarEntry[]> {
      const rows = await this.db(TABLE_NAME).select(
          'entry_id',
          'title',
          'description',
          'url',
          'quadrant_name',
          'disposition_name',
          'date'
      );

      return rows.map(row => ({
          entry_id: row.entry_id,
          title: row.title,
          description: row.description,
          url: row.url,
          quadrant_name: row.quadrant_name,
          disposition_name: row.disposition_name,
          date: new Date(row.date),
      }));
  }
}