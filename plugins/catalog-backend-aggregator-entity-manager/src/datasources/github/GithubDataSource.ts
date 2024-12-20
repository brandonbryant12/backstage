import { Entity } from '@backstage/catalog-model';
import { DataSource } from '../DataSource';
import { LoggerService, UrlReaderService } from '@backstage/backend-plugin-api';
import yaml from 'yaml';

export class GithubDataSource extends DataSource {
  private readonly urlReader: UrlReaderService;

  constructor(
    config: {
      name: string;
      priority: number;
      refreshSchedule?: { frequency: { seconds: number }, timeout: { minutes: number } };
      ttlSeconds?: number;
    },
    logger: LoggerService,
    urlReader: UrlReaderService
  ) {
    super(config, logger);
    this.urlReader = urlReader;
  }

  getAllTargetUrls(): string[] {
    return ['https://github.com/brandonbryant12/backstage/blob/master/catalog-info.yaml'];
  }

  async refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void> {
    const urls = this.getAllTargetUrls();
    
    for (const url of urls) {
      try {
        const data = await this.urlReader.readUrl(url);
        const raw = await data.buffer();
        const documents = yaml.parseAllDocuments(raw.toString());
        const entities: Entity[] = documents.map(doc => doc.toJSON());
        await provide(entities);
        this.logger.info(`Fetched and provided ${entities.length} entities from ${url}`);
      } catch (error) {
        this.logger.error(`Failed to fetch entities from ${url}`, error as Error);
      }
    }
  }
}