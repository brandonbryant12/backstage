
// <ai_context>
// This file defines the TechRadarFactory class. Its primary responsibility is to
// define the static structure of the radar (quadrants, rings) and to combine this
// structure with the dynamic entry data fetched from the TechRadarDataEntryRepository
// (including parsing JSON fields) to produce the final TechRadarLoaderResponse
// expected by the frontend, adhering to the common data model.
// Refactored to extract entry transformation logic for better readability.
// </ai_context>
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  RadarEntry,
  RadarQuadrant,
  RadarRing,
  TechRadarLoaderResponse,
  RadarEntrySnapshot,
  RadarEntryLink,
  MovedState,
} from '@backstage-community/plugin-tech-radar-common';
import {
  TechRadarDataEntryRepository,
  RawDbEntry,
} from '../database/TechRadarDataEntryRepository';
import { NotFoundError } from '@backstage/errors';

// Define default structure matching the common model's expectation for order
const DEFAULT_QUADRANTS: RadarQuadrant[] = [
  { id: 'solutions', name: 'Solutions' }, // Bottom Right (index 0)
  { id: 'patterns', name: 'Patterns' }, // Bottom Left (index 1)
  { id: 'guidelines', name: 'Guidelines' }, // Top Left (index 2)
  { id: 'standards', name: 'Standards' }, // Top Right (index 3)
];

const DEFAULT_RINGS: RadarRing[] = [
  { id: 'approved', name: 'Approved', color: '#5BA300' }, // Inner ring (index 0) Green
  { id: 'emerging', name: 'Emerging', color: '#C7BA00' }, // Yellow
  { id: 'submitted', name: 'Submitted', color: '#009EB0' }, // Blue
  { id: 'restricted', name: 'Restricted', color: '#E09B96' }, // Outer ring (index 3) Red
];

export class TechRadarFactory {
  private readonly quadrants: RadarQuadrant[];
  private readonly rings: RadarRing[];
  private readonly quadrantMap: Map<string, RadarQuadrant>;
  private readonly ringMap: Map<string, RadarRing>;

  constructor(
    private readonly repository: TechRadarDataEntryRepository,
    private readonly logger: LoggerService,
    quadrants: RadarQuadrant[] = DEFAULT_QUADRANTS,
    rings: RadarRing[] = DEFAULT_RINGS,
  ) {
    this.quadrants = quadrants;
    this.rings = rings;
    this.quadrantMap = new Map(quadrants.map(q => [q.id, q]));
    this.ringMap = new Map(rings.map(r => [r.id, r]));
    this.logger.info('TechRadarFactory initialized.');
  }

  /**
   * Transforms a raw database entry into the final RadarEntry structure.
   * Performs validation, parsing, and mapping against static definitions.
   */
  private _transformDbEntryToRadarEntry(dbEntry: RawDbEntry): RadarEntry | null {
     try {
       // 1. Map Quadrant ID and validate
       const quadrant = this.quadrantMap.get(dbEntry.quadrant_id);
       if (!quadrant) {
          this.logger.warn(`Quadrant ID '${dbEntry.quadrant_id}' for entry '${dbEntry.key}' not found in factory definition. Skipping entry.`);
          return null;
       }
       const quadrantId = quadrant.id; // Use the validated ID string

       // 2. Parse and process Timeline JSON
       let parsedTimeline: any[];
       try {
          parsedTimeline = JSON.parse(dbEntry.timeline || '[]');
          if (!Array.isArray(parsedTimeline)) throw new Error('Timeline JSON is not an array');
       } catch (parseError: any) {
           this.logger.warn(`Failed to parse timeline JSON for entry '${dbEntry.key}'. Skipping entry. Error: ${parseError.message}`, { rawTimeline: dbEntry.timeline });
           return null;
       }

       const timeline: RadarEntrySnapshot[] = parsedTimeline
         .map((t: any, index: number) => {
           // Validate Ring ID
           const ring = this.ringMap.get(t.ringId);
           if (!ring) {
             this.logger.warn(`Timeline Ring ID '${t.ringId}' for entry '${dbEntry.key}' (index ${index}) not found in factory definition. Skipping timeline event.`);
             return null;
           }

           // Validate and parse Date
           let date: Date;
           try {
              date = new Date(t.date);
              if (isNaN(date.getTime())) throw new Error('Invalid date format');
           } catch(e) {
              this.logger.warn(`Invalid date format in timeline for entry '${dbEntry.key}' (index ${index}): '${t.date}'. Skipping timeline event.`);
              return null;
           }

           // Validate Moved State
           const moved = Object.values(MovedState).includes(t.moved) ? t.moved : MovedState.NoChange;

           // Return the snapshot adhering to the common model
           return {
             date: date, // Keep as Date object for sorting
             ringId: ring.id, // Use the validated string ID
             description: t.description,
             moved: moved,
           };
         })
         .filter((snapshot): snapshot is RadarEntrySnapshot => snapshot !== null) // Filter out skipped timeline events
         .sort((a, b) => b.date.getTime() - a.date.getTime()); // Ensure sorted desc (most recent first)

       // Entry must have at least one valid timeline event
       if (timeline.length === 0) {
          this.logger.warn(`Entry '${dbEntry.key}' has no valid timeline events after processing. Skipping entry.`);
          return null;
       }

       // 3. Parse Links JSON
       let links: RadarEntryLink[] | undefined;
       if (dbEntry.links) {
           try {
              links = JSON.parse(dbEntry.links);
              if (!Array.isArray(links)) throw new Error('Links JSON is not an array');
              // Basic validation for link structure
              links = links.filter(link => link && typeof link.url === 'string' && typeof link.title === 'string');
           } catch(parseError: any) {
              this.logger.warn(`Failed to parse links JSON for entry '${dbEntry.key}'. Links will be ignored. Error: ${parseError.message}`, { rawLinks: dbEntry.links });
              links = undefined;
           }
       }

       // 4. Assemble the final RadarEntry
       const entry: RadarEntry = {
         key: dbEntry.key,
         id: dbEntry.id,
         title: dbEntry.title,
         quadrant: quadrantId, // Use string ID
         timeline: timeline,
         description: dbEntry.description,
         links: links,
       };
       return entry;

     } catch (error: any) {
       // Catch any unexpected errors during processing of a single entry
       this.logger.warn(`Skipping entry '${dbEntry.key}' due to unexpected processing error: ${error.message}`, { error });
       return null;
     }
  }

  async buildRadarResponse(
    _radarId?: string, // Placeholder for multi-radar support
  ): Promise<TechRadarLoaderResponse> {
    this.logger.info('Building Tech Radar response...');
    const rawEntries = await this.repository.findAllEntries();

    const entries: RadarEntry[] = rawEntries
      .map(dbEntry => this._transformDbEntryToRadarEntry(dbEntry))
      .filter((entry): entry is RadarEntry => entry !== null); // Filter out entries that were skipped

    this.logger.info(`Successfully built radar response with ${entries.length} entries.`);

    // Return the final response structure
    return {
      quadrants: this.quadrants, // Use the factory's static definition
      rings: this.rings, // Use the factory's static definition
      entries: entries, // Use the processed entries
    };
  }
}
      