
// <ai_context>
// This file implements the CsvTechRadarDataService, inheriting from TechRadarDataService.
// It handles fetching a CSV file from a configured URL using UrlReaderService,
// parsing the CSV content (assuming a simplified format representing the latest state),
// and transforming the records into the SourceEntry format expected by the repository.
// It includes validation and processing for timeline (single event) and links.
// Refactored to extract record transformation logic for better readability.
// </ai_context>
import {
  LoggerService,
  RootConfigService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { parse } from 'csv-parse';
import { TechRadarDataService } from './TechRadarDataService';
import { SourceEntry } from '../database/TechRadarDataEntryRepository';
import { InputError } from '@backstage/errors';
import {
  RadarEntryLink,
  RadarEntrySnapshot,
  MovedState,
} from '@backstage-community/plugin-tech-radar-common';

// Define expected CSV columns for the simplified "latest state" format
// Adjust based on your actual CSV structure
const EXPECTED_COLUMNS = [
  'key', 'id', 'title', 'quadrant', 'ring', 'description', 'date', 'moved',
  'timeline_description', 'link_title_1', 'link_url_1', 'link_title_2', 'link_url_2',
  // Add more link columns if needed: link_title_3, link_url_3, ...
];

export class CsvTechRadarDataService extends TechRadarDataService {
  private readonly csvUrl: string;

  constructor(
    private readonly config: RootConfigService,
    private readonly logger: LoggerService,
    private readonly reader: UrlReaderService,
  ) {
    super();
    // Expecting config: myTechRadar.source.csv.url
    this.csvUrl = this.config.getString('myTechRadar.source.csv.url');
    if (!this.csvUrl) {
      throw new InputError('Missing myTechRadar.source.csv.url configuration');
    }
    this.logger.info(`CSV Tech Radar source configured: ${this.csvUrl}`);
  }

  /**
   * Transforms a single parsed CSV record into a SourceEntry object.
   * Performs validation and data preparation for the repository.
   */
  private _transformCsvRecordToSourceEntry(record: any, recordNumber: number): SourceEntry | null {
     // Basic validation for required fields from the CSV row
     if (!record.key || !record.title || !record.quadrant || !record.ring || !record.date) {
       this.logger.warn(
         `Skipping CSV record ${recordNumber} due to missing required fields (key, title, quadrant, ring, date): ${JSON.stringify(record)}`,
       );
       return null;
     }

     // Process the single timeline entry from the CSV row
     let timelineDate: Date;
     try {
        timelineDate = new Date(record.date);
        if (isNaN(timelineDate.getTime())) {
           throw new Error('Invalid date format');
        }
     } catch (e) {
       this.logger.warn(`Skipping CSV record ${recordNumber} (key: ${record.key}) due to invalid date: '${record.date}'`);
       return null;
     }

     // Process 'moved' state
     let movedState = MovedState.NoChange; // Default
     if (record.moved !== undefined && record.moved !== null && record.moved !== '') {
         const movedNum = parseInt(record.moved, 10);
         if (Object.values(MovedState).includes(movedNum)) {
            movedState = movedNum as MovedState;
         } else {
            this.logger.warn(`Record ${recordNumber} (key: ${record.key}) has invalid 'moved' value: '${record.moved}'. Using default 'NoChange'.`);
         }
     }

     // Create the single timeline snapshot (assuming CSV has latest state)
     const timelineSnapshot: Partial<RadarEntrySnapshot> = {
       date: timelineDate,
       ringId: record.ring,
       description: record.timeline_description,
       moved: movedState,
     };
     const timeline: Partial<RadarEntrySnapshot>[] = [timelineSnapshot];

     // Process links
     const links: Partial<RadarEntryLink>[] = [];
     // Handle deprecated 'url' column if present
     if (record.url && typeof record.url === 'string') {
       links.push({ title: 'Learn More', url: record.url });
     }
     // Add structured links (example for 2 pairs)
     if (record.link_url_1 && record.link_title_1) {
       links.push({ url: record.link_url_1.trim(), title: record.link_title_1.trim() });
     }
     if (record.link_url_2 && record.link_title_2) {
       links.push({ url: record.link_url_2.trim(), title: record.link_title_2.trim() });
     }
     // Add more link processing here if necessary

     // Assemble the SourceEntry
     return {
       key: record.key,
       id: record.id || record.key, // Use key if id is missing/empty
       title: record.title,
       quadrant: record.quadrant, // Store Quadrant ID string
       description: record.description,
       timeline: timeline,
       links: links.length > 0 ? links : undefined,
     };
  }


  async read(): Promise<SourceEntry[]> {
    this.logger.info(`Reading Tech Radar data from CSV: ${this.csvUrl}`);
    let csvContent: Buffer;
    try {
      const response = await this.reader.readUrl(this.csvUrl);
      csvContent = await response.buffer();
    } catch (error: any) {
      this.logger.error(`Failed to read CSV from ${this.csvUrl}: ${error.message}`, { error });
      throw new Error(`Failed to read CSV from ${this.csvUrl}: ${error.message}`);
    }

    const parser = parse(csvContent, {
      columns: header => {
        // Use lower case for consistent mapping
        const lowerHeader = header.map((h: string) => h.toLowerCase().trim());
        const requiredCols = ['key', 'title', 'quadrant', 'ring', 'date'];
        const missing = requiredCols.filter(col => !lowerHeader.includes(col));

        if (missing.length > 0 && lowerHeader.length > 0) {
           this.logger.warn(
             `CSV header is missing required columns: ${missing.join(', ')}. Parsing errors may occur.`, { actualHeader: header}
           );
        }
        return lowerHeader.length > 0 ? lowerHeader : EXPECTED_COLUMNS;
      },
      skip_empty_lines: true,
      trim: true,
    });

    const sourceEntries: SourceEntry[] = [];
    let recordCount = 0;
    let skippedCount = 0;

    for await (const record of parser) {
      recordCount++;
      const sourceEntry = this._transformCsvRecordToSourceEntry(record, recordCount);
      if (sourceEntry) {
         sourceEntries.push(sourceEntry);
      } else {
         skippedCount++;
      }
    }

    this.logger.info(
      `Finished reading CSV. Total records processed: ${recordCount}, Valid entries created: ${sourceEntries.length}, Skipped records: ${skippedCount}.`,
    );
    return sourceEntries;
  }
}
      