import { Entity } from '@backstage/catalog-model';
import { DataSource, DataSourceConfig } from './DataSource';
import { LoggerService } from '@backstage/backend-plugin-api';
import { generateMockEntities } from './mockEntityFactory';

interface DataSourceAConfig extends DataSourceConfig {
  ttlSeconds?: number;
}

export class DataSourceA extends DataSource {
  constructor(
    config: DataSourceAConfig,
    logger: LoggerService,
  ) {
    super(config, logger);
  }

  async refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void> {
    try {
      // Generate test entities (10 of each type)
      const entities = generateMockEntities(10, {
        source: 'DataSourceA',
        tier: 'frontend',
        team: 'team-a',
        apiVersion: 'v1',
      });
      
      // Process all entities at once with expiration date if TTL is set
      const expirationDate = this.getExpirationDate();
      if (expirationDate) {
        this.logger.debug(`Setting expiration date to ${expirationDate.toISOString()}`);
      }
      
      await provide(entities);
      
      this.logger.info(
        `Successfully refreshed ${entities.length} entities${
          expirationDate ? ` with expiration date ${expirationDate.toISOString()}` : ''
        }`
      );
    } catch (error) {
      const message = `Failed to refresh entities for ${this.getName()}`;
      this.logger.error(message, error as Error);
    }
  }
}