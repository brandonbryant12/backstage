
// <ai_context>
// This file defines the TechRadarDataEntryRepository class, responsible for database
// operations (inserting, deleting, fetching) related to tech radar entries.
// It interacts with the Knex instance provided by the core database service and handles
// storing/retrieving data including JSONB fields like 'timeline' and 'links'.
// Refactored to extract entry transformation logic for better readability.
// </ai_context>
import { Knex } from 'knex';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  RadarEntry,
  RadarEntryLink,
  RadarEntrySnapshot,
  MovedState,
} from '@backstage-community/plugin-tech-radar-common';

// Represents the structure stored in the database row
type DbRow = {
  key: string;
  id: string;
  title: string;
  quadrant_id: string;
  ring_id: string;
  description?: string;
  timeline: string; // JSON string
  links: string | null; // JSON string or null
};

// Represents the raw structure fetched from the database
export type RawDbEntry = {
  key: string;
  id: string;
  title: string;
  quadrant_id: string;
  ring_id: string; // Representing the *current* ring based on latest timeline
  description?: string;
  timeline: string; // JSON string representing RadarEntrySnapshot[]
  links?: string; // JSON string representing RadarEntryLink[]
};

// Represents the data structure after reading from source (e.g., CSV)
// before saving to the database. Allows partial data during processing.
// Note: This structure aligns closely with RadarEntry but allows intermediate states.
export type SourceEntry = Partial<Omit<RadarEntry, 'timeline' | 'links' | 'quadrant'>> & {
  quadrant: string | { id: string }; // Allow string ID from source (e.g., CSV)
  // Raw timeline from source, needs parsing/validation before DB storage
  timeline: Partial<RadarEntrySnapshot>[];
  // Raw links from source, may need validation
  links?: Partial<RadarEntryLink>[];
};


export class TechRadarDataEntryRepository {
  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Transforms a source entry into a structure suitable for database insertion.
   * Performs validation and data preparation.
   */
  private _transformSourceEntryToDbRow(entry: SourceEntry): DbRow | null {
     // Basic validation for required fields before processing
     if (!entry.key || !entry.title || !entry.quadrant || !entry.timeline || entry.timeline.length === 0) {
       this.logger.warn(`Skipping entry due to missing required fields (key, title, quadrant, timeline): ${JSON.stringify(entry)}`);
       return null;
     }

     // Sort timeline descending by date to easily get the latest for 'ring_id' column
     // and ensure consistent order before storing as JSON.
     const sortedTimeline = [...entry.timeline]
       .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

     const latestTimelineEntry = sortedTimeline[0];

     // Validate latest timeline entry has necessary fields
     if (!latestTimelineEntry?.ringId || !latestTimelineEntry?.date) {
       this.logger.warn(`Skipping entry '${entry.key}' due to invalid latest timeline event (missing ringId or date).`);
       return null;
     }

     // Prepare timeline for JSON storage: ensure dates are ISO strings and 'moved' is valid
     const dbTimeline = sortedTimeline.map(t => {
       let dateIso: string | undefined;
       try {
          // Attempt to create a Date object and convert to ISO string
          const dateObj = t.date instanceof Date ? t.date : new Date(t.date ?? 0);
          if (isNaN(dateObj.getTime())) throw new Error('Invalid date');
          dateIso = dateObj.toISOString();
       } catch (e) {
          this.logger.warn(`Invalid date encountered in timeline for entry '${entry.key}': ${t.date}. Skipping timeline entry.`);
          return null; // Mark this specific timeline entry as invalid
       }

       // Validate or default 'moved' state
       const moved = typeof t.moved === 'number' && Object.values(MovedState).includes(t.moved)
         ? t.moved
         : MovedState.NoChange; // Default if undefined or invalid

       return {
         date: dateIso, // Store date as ISO string
         ringId: t.ringId, // Ensure ringId exists (validated above for latest entry)
         description: t.description,
         moved: moved,
       };
     }).filter((t): t is NonNullable<typeof t> => t !== null); // Remove any invalid timeline entries


     // If all timeline entries were invalid, skip the main entry
     if (dbTimeline.length === 0) {
        this.logger.warn(`Skipping entry '${entry.key}' because all its timeline entries were invalid.`);
        return null;
     }

     return {
       key: entry.key,
       id: entry.id ?? entry.key, // Default id to key if not provided
       title: entry.title,
       quadrant_id: typeof entry.quadrant === 'string' ? entry.quadrant : entry.quadrant?.id ?? 'unknown', // Store the ID
       ring_id: dbTimeline[0].ringId, // Store latest ring ID from the processed timeline
       description: entry.description,
       // Stringify the processed timeline and links for JSONB storage
       timeline: JSON.stringify(dbTimeline),
       links: entry.links && entry.links.length > 0 ? JSON.stringify(entry.links) : null,
     };
  }

  async replaceAllEntries(entries: SourceEntry[]): Promise<void> {
    await this.db.transaction(async trx => {
      this.logger.info(`Deleting all existing tech radar entries.`);
      await trx('my_tech_radar_entries').del();

      if (!entries || entries.length === 0) {
        this.logger.info('No new entries provided, table cleared.');
        return;
      }

      this.logger.info(`Processing ${entries.length} source entries for insertion.`);
      const dbRows = entries
        .map(entry => this._transformSourceEntryToDbRow(entry))
        .filter((row): row is DbRow => row !== null); // Filter out skipped entries

      if (dbRows.length > 0) {
        this.logger.info(`Inserting ${dbRows.length} valid tech radar entries.`);
        // Use batchInsert for potentially better performance with many rows
        await trx.batchInsert('my_tech_radar_entries', dbRows, 50); // Adjust chunk size as needed
        this.logger.info(`Successfully inserted ${dbRows.length} tech radar entries.`);
      } else {
         this.logger.info(`No valid entries found to insert after processing.`);
      }
    });
  }

  async findAllEntries(): Promise<RawDbEntry[]> {
    this.logger.info('Fetching all tech radar entries from database.');
    // Select all columns needed by the factory
    const rows = await this.db<RawDbEntry>('my_tech_radar_entries').select(
      'key',
      'id',
      'title',
      'quadrant_id',
      'ring_id', // Fetched but Factory primarily uses timeline
      'description',
      'timeline', // Fetched as JSON string
      'links', // Fetched as JSON string
    );
    this.logger.info(`Fetched ${rows.length} entries.`);
    return rows;
  }
}
      