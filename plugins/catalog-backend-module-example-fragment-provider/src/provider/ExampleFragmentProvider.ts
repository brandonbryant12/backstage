import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { generateMockEntities } from './mockEntityFactory'
import { EntityAggregatorService } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';

export class ExampleFragmentProvider {
  private readonly schedule = { frequency: { minutes: 2 }, timeout: { minutes: 5 } };

  constructor(
    private readonly entityAggregatorService: EntityAggregatorService,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
  ) {}

  async start() {
    const runner = this.scheduler.createScheduledTaskRunner(this.schedule);
    await runner.run({
      id: 'example-fragment-provider-refresh',
      fn: async () => {
        await this.refresh();
      },
    });
  }

  private async refresh(): Promise<void> {
    try {
      const entities = generateMockEntities(10, {
        source: 'ExampleFragmentProvider',
        tier: 'frontend',
        team: 'team-a',
      });

      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      await this.entityAggregatorService.updateOrCreateEntityFragments(
        'ExampleFragmentProvider',
        entities,
        50,
        oneDayFromNow
      );

      this.logger.info(
        `Successfully refreshed ${entities.length} entity fragments`,
      );
    } catch (error) {
      this.logger.error('Failed to refresh entity fragments', error as Error);
    }
  }
} 