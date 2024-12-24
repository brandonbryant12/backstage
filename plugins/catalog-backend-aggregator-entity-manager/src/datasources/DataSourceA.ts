import { Entity } from '@backstage/catalog-model';
import { DataSource } from './DataSource';
import { generateMockEntities } from './mockEntityFactory';

export class DataSourceA extends DataSource {
  async refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void> {
    try {
      const entities = generateMockEntities(10, {
        source: 'DataSourceA',
        tier: 'frontend',
        team: 'team-a',
        apiVersion: 'v1',
      });

      await provide(entities);

      this.logger.info(
        `Successfully refreshed ${entities.length} entities`
      );
    } catch (error) {
      const message = `Failed to refresh entities for ${this.getName()}`;
      this.logger.error(message, error as Error);
    }
  }
}