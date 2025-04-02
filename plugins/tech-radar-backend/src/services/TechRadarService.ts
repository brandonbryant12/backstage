import { LoggerService } from '@backstage/backend-plugin-api';
import {
  MovedState,
  RadarEntry,
  RadarEntrySnapshot,
  RadarQuadrant,
  RadarRing,
  TechRadarLoaderResponse,
} from '@backstage-community/plugin-tech-radar-common';
import { EntriesRepository, TechRadarEntry } from '../repository/entriesRepository';

export interface TechRadarServiceOptions {
  logger: LoggerService;
  repository: EntriesRepository;
}

export class TechRadarService {
  private readonly logger: LoggerService;
  private readonly repository: EntriesRepository;

  constructor(options: TechRadarServiceOptions) {
    this.logger = options.logger.child({ service: 'TechRadarService' });
    this.repository = options.repository;
  }

  private getQuadrants(): RadarQuadrant[] {
    return [
      { id: 'solutions', name: 'Solutions' },
      { id: 'guidelines', name: 'Guidelines' },
      { id: 'patterns', name: 'Patterns' },
      { id: 'standards', name: 'Standards' },
    ];
  }

  private getRings(): RadarRing[] {
    return [
      { id: 'submitted', name: 'Submitted', color: '#9e9e9e' }, // Grey
      { id: 'emerging', name: 'Emerging', color: '#8bc34a' },   // Light Green
      { id: 'approved', name: 'Approved', color: '#4caf50' },   // Green
      { id: 'restricted', name: 'Restricted', color: '#ff9800' }, // Orange
    ];
  }

  private mapDispositionToRingId(disposition?: string): string {
    const lowerDisposition = disposition?.toLowerCase();
    switch (lowerDisposition) {
      case 'approved':
        return 'approved';
      case 'emerging':
        return 'emerging';
      case 'restricted':
      case 'prohibited':
        return 'restricted';
      default:
        return 'submitted';
    }
  }
  private mapQuadrantNameToId(quadrantName?: string): string {
    return quadrantName?.toLowerCase() ?? 'unknown'; 
  }

  async getData(): Promise<TechRadarLoaderResponse> {
    this.logger.info('Fetching and processing Tech Radar entries');
    const repoEntries: TechRadarEntry[] = await this.repository.getAllEntries();

    const quadrants = this.getQuadrants();
    const rings = this.getRings();

    const mappedEntries: RadarEntry[] = repoEntries.map(repoEntry => {
      const ringId = this.mapDispositionToRingId(repoEntry.disposition_name);
      const quadrantId = this.mapQuadrantNameToId(repoEntry.quadrant_name);
      const entryDate = repoEntry.date ?? new Date();

      const timeline: RadarEntrySnapshot[] = [
        {
          date: entryDate,
          ringId: ringId,
          moved: MovedState.NoChange,
        },
      ];

      return {
        key: repoEntry.entry_id,
        id: repoEntry.entry_id,
        quadrant: quadrantId, 
        title: repoEntry.title,
        description: repoEntry.description,
        timeline: timeline,
        ...(repoEntry.url && { links: [{ url: repoEntry.url, title: 'Learn More' }]}),
        url: repoEntry.url, 
      };
    });
    
    // Filter based on known quadrant IDs
    const knownQuadrantIds = new Set(quadrants.map(q => q.id));
    const entries = mappedEntries.filter(entry => knownQuadrantIds.has(entry.quadrant));

    return {
      quadrants,
      rings,
      entries,
    };
  }
}