import { Entity } from '@backstage/catalog-model';
import { DataSource } from './DataSource';
import { chunk } from 'lodash';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { generateMockEntities } from './mockEntityFactory';

export class DataSourceB extends DataSource {
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
        source: 'DataSourceB',
        tier: 'backend',
        team: 'team-b',
        apiVersion: 'v2',
      });
      await provide(entities);
      this.logger.info(`Successfully refreshed ${entities.length} entities`);
    } catch (error) {
      const message = `Failed to refresh entities for ${this.getName()}`;
      this.logger.error(message, error as Error);
    }
  }
}