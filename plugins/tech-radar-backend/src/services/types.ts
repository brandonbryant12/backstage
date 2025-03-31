
import { TechRadarLoaderResponse } from '@backstage-community/plugin-tech-radar-common';

/**
 * Represents a single raw record fetched from the data source (e.g., Snowflake table row or CSV row).
 * Matches the columns specified by the user.
 *
 * @public
 */
export interface EntryRecord {
  entry_id: string;
  title: string;
  description?: string;
  url?: string;
  quadrant_name: string;
  disposition_name: string;
  date: string | Date;
}

/**
 * Interface for fetching and processing Tech Radar entries.
 *
 * @public
 */
export interface EntriesRepository {
  getTechRadarData(): Promise<TechRadarLoaderResponse>;
}
      