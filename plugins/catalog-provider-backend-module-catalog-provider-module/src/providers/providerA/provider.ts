import { EntityProvider, EntityProviderConnection } from '@backstage/plugin-catalog-node';
import { SchedulerServiceTaskRunner, LoggerService } from '@backstage/backend-plugin-api';
import mockData from '../mockBaseEntities.json';

export class ProviderA implements EntityProvider {
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
    return 'provider-a';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    this.logger.info('Connecting ProviderA');
    await this.scheduleFn();
  }

  async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to catalog');
    }

    this.logger.info('Refreshing entities in ProviderA');
    
    const deferredEntities = mockData.entities.map(entity => {
      const locationKey = `provider-a-${entity.metadata.name}`;
      return {
        entity: {
          apiVersion: entity.apiVersion,
          kind: entity.kind,
          metadata: {
            ...entity.metadata,
            annotations: {
              ...entity.metadata.annotations,
              'backstage.io/managed-by-location': `url:${locationKey}`,
              'backstage.io/managed-by-origin-location': `url:${locationKey}`,
            },
          },
          spec: entity.spec,
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
