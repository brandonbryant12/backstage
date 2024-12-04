import { Entity } from '@backstage/catalog-model';
import { DataSource } from './DataSource';
import { chunk } from 'lodash';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { generateMockEntities } from './mockEntityFactory';

export class DataSourceA extends DataSource {
  constructor(
    config: { 
      name: string; 
      priority: number; 
      refreshSchedule: SchedulerServiceTaskScheduleDefinition;
    },
    logger: LoggerService,
  ) {
    super({
      ...config,
      refreshSchedule: config.refreshSchedule,
    }, logger);
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
      
      // Process in chunks of 100 entities
      const chunks = chunk(entities, 100);
      
      for (const batch of chunks) {
        this.logger.debug(`Processing batch of ${batch.length} entities`);
        await provide(batch);
      }
      
      this.logger.info(`Successfully refreshed ${entities.length} entities`);
    } catch (error) {
      const message = `Failed to refresh entities for ${this.getName()}`;
      this.logger.error(message, error as Error);
    }
  }
}