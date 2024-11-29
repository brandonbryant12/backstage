import { 
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { 
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';

/**
 * Configuration for the test provider
 */
export interface TestProviderConfig {
  /** Provider name suffix to distinguish between instances */
  name: string;
  /** Initial set of entities to provide */
  entities: Entity[];
  /** Additional annotations to add to all entities */
  annotations?: Record<string, string>;
}

/**
 * Test provider that simulates entity updates using delta mutations
 */
export class TestProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private readonly providerName: string;
  private entities: Entity[];
  private readonly annotations: Record<string, string>;

  constructor(
    config: TestProviderConfig,
    logger: LoggerService,
    schedule: SchedulerServiceTaskRunner,
  ) {
    this.providerName = `test-provider-${config.name}`;
    this.logger = logger;
    this.entities = config.entities;
    this.annotations = {
      [`${this.providerName}/managed`]: 'true',
      ...config.annotations,
    };
    this.scheduleFn = this.createScheduleFn(schedule);
  }

  getProviderName(): string {
    return this.providerName;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    this.logger.info(`Connecting ${this.providerName}`);
    await this.scheduleFn();
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

  /**
   * Updates the set of test entities
   */
  setEntities(entities: Entity[]): void {
    this.entities = entities;
  }

  /**
   * Simulates updating an entity
   */
  async updateEntity(entityName: string, updates: Partial<Entity>): Promise<void> {
    if (!this.connection) {
      throw new Error(`${this.providerName} is not connected`);
    }

    const entity = this.entities.find(e => e.metadata.name === entityName);
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }

    // Create updated entity by deep merging updates
    const updatedEntity = {
      ...entity,
      metadata: {
        ...entity.metadata,
        ...updates.metadata,
        annotations: {
          ...entity.metadata.annotations,
          ...this.annotations,
          ...(updates.metadata?.annotations || {}),
        },
      },
      spec: {
        ...entity.spec,
        ...(updates.spec || {}),
      },
    };

    await this.connection.applyMutation({
      type: 'delta',
      added: [{
        entity: updatedEntity,
        locationKey: `${this.providerName}:${entityName}`,
      }],
      removed: [],
    });

    this.logger.info(`Updated entity ${entityName} in ${this.providerName}`);
  }

  /**
   * Simulates removing an entity
   */
  async removeEntity(entityName: string): Promise<void> {
    if (!this.connection) {
      throw new Error(`${this.providerName} is not connected`);
    }

    const entity = this.entities.find(e => e.metadata.name === entityName);
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }

    await this.connection.applyMutation({
      type: 'delta',
      added: [],
      removed: [{
        entity,
        locationKey: `${this.providerName}:${entityName}`,
      }],
    });

    this.logger.info(`Removed entity ${entityName} from ${this.providerName}`);
  }

  /**
   * Refreshes all test entities
   */
  async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error(`${this.providerName} is not connected`);
    }

    this.logger.info(`Starting refresh of ${this.providerName}`);

    const enrichedEntities = this.entities.map(entity => ({
      entity: {
        ...entity,
        metadata: {
          ...entity.metadata,
          annotations: {
            ...entity.metadata.annotations,
            ...this.annotations,
          },
        },
      },
      locationKey: `${this.providerName}:${entity.metadata.name}`,
    }));

    await this.connection.applyMutation({
      type: 'delta',
      added: enrichedEntities,
      removed: [],
    });

    this.logger.info(`Completed refresh of ${this.providerName}`);
  }
}
