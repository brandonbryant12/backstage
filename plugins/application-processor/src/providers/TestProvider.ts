import { 
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { 
  LoggerService,
  SchedulerService,
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
  /** Cron expression for scheduling */
  cron: string;
  /** Initial delay before first run (in milliseconds) */
  initialDelay?: number;
}

/**
 * Test provider that simulates entity updates using delta mutations
 */
export class TestProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly logger: LoggerService;
  private readonly scheduler: SchedulerService;
  private readonly providerName: string;
  private entities: Entity[];
  private readonly annotations: Record<string, string>;
  private readonly cron: string;
  private readonly initialDelay: number;

  constructor(
    config: TestProviderConfig,
    logger: LoggerService,
    scheduler: SchedulerService,
  ) {
    this.providerName = `test-provider-${config.name}`;
    this.logger = logger;
    this.scheduler = scheduler;
    this.entities = config.entities;
    this.cron = config.cron;
    this.initialDelay = config.initialDelay || 0;
    this.annotations = {
      [`${this.providerName}/managed`]: 'true',
      ...config.annotations,
    };
  }

  getProviderName(): string {
    return this.providerName;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    this.logger.info(`Connecting ${this.providerName} with schedule: ${this.cron}`);
    
    if (this.initialDelay > 0) {
      this.logger.info(`${this.providerName} will start after ${this.initialDelay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, this.initialDelay));
    }

    await this.scheduler.scheduleTask({
      id: `${this.providerName}-refresh`,
      frequency: { cron: this.cron },
      timeout: { minutes: 1 },
      fn: async () => {
        await this.refresh();
      },
    });
  }

  async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error(`${this.providerName} is not connected`);
    }

    this.logger.info(`Starting refresh of ${this.providerName}`);
    this.logger.info(`Current entity annotations for ${this.providerName}:`, {
      entityAnnotations: this.entities[0].metadata.annotations,
      providerAnnotations: this.annotations,
    });

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

    this.logger.info(`Completed refresh of ${this.providerName}`, {
      enrichedAnnotations: enrichedEntities[0].entity.metadata.annotations,
    });
  }

  /**
   * Updates the set of test entities
   */
  setEntities(entities: Entity[]): void {
    this.entities = entities;
    this.logger.info(`Updated entities for ${this.providerName}`, {
      count: entities.length,
      firstEntityName: entities[0]?.metadata.name,
    });
  }

  /**
   * Simulates updating an entity
   */
  async updateEntity(entityName: string, updates: Partial<Entity>): Promise<void> {
    if (!this.connection) {
      throw new Error(`${this.providerName} is not connected`);
    }

    this.logger.info(`Attempting to update entity ${entityName} in ${this.providerName}`);

    const entity = this.entities.find(e => e.metadata.name === entityName);
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }

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

    this.logger.info(`Updated entity ${entityName} in ${this.providerName}`, {
      updatedAnnotations: updatedEntity.metadata.annotations,
    });
  }

  /**
   * Simulates removing an entity
   */
  async removeEntity(entityName: string): Promise<void> {
    if (!this.connection) {
      throw new Error(`${this.providerName} is not connected`);
    }

    this.logger.info(`Attempting to remove entity ${entityName} from ${this.providerName}`);

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
}