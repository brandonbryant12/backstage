
// <ai_context>
// This file defines the abstract base class 'TechRadarDataService'.
// Concrete implementations (like CsvTechRadarDataService) will inherit from this,
// ensuring a consistent interface for reading tech radar data from various sources.
// </ai_context>
import { SourceEntry } from '../database/TechRadarDataEntryRepository';

/**
 * Abstract definition for services that read tech radar entry data from a source.
 */
export abstract class TechRadarDataService {
  /**
   * Reads raw entry data from the configured source.
   * Implementations should handle fetching, parsing, and basic validation/transformation
   * into the SourceEntry structure.
   */
  abstract read(): Promise<SourceEntry[]>;
}
      