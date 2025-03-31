import { LoggerService } from '@backstage/backend-plugin-api';
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

  async getData(): Promise<TechRadarEntry[]> {
    this.logger.info('Fetching all Tech Radar entries');
    const entries = await this.repository.getAllEntries();
    return entries
  }
} 