import { EntityProvider, EntityProviderConnection } from '@backstage/plugin-catalog-node';
import { LoggerService, SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import mockData from '../mockBaseEntities.json';

export class ProviderB implements EntityProvider {
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  constructor(logger: LoggerService, schedule: SchedulerServiceTaskRunner) {
    this.logger = logger;
    this.scheduleFn = this.createScheduleFn(schedule);
  }

  private createScheduleFn(
    schedule: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return schedule.run({
        id: taskId,
        fn: async () => {
          try {
            await this.refresh();
          } catch (error) {
            this.logger.error(`Failed to refresh: ${error}`);
          }
        },
      });
    };
  }

  getProviderName(): string {
    return 'provider-b';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    this.logger.info('Connecting ProviderB');
    await this.scheduleFn();
  }

  async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to catalog');
    }

    this.logger.info('Refreshing entities in ProviderB');
    
    const deferredEntities = mockData.entities.map(entity => {
      const locationKey = `provider-b-${entity.metadata.name}`;
      return {
        entity: {
          apiVersion: entity.apiVersion,
          kind: entity.kind,
          metadata: {
            name: entity.metadata.name,
            annotations: {
              'backstage.io/managed-by-location': `url:${locationKey}`,
              'backstage.io/managed-by-origin-location': `url:${locationKey}`,
              ...(entity.kind === 'Component' && {
                timestamp: new Date().toISOString(),
              }),
            },
          },
        },
        locationKey,
      };
    });

    await this.connection.applyMutation({
      type: 'delta',
      added: deferredEntities,
      removed: [],
    });
  }
}
