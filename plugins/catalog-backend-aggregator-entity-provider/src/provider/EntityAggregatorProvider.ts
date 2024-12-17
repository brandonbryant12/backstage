import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { 
  EntityAggregatorService, 
} from '@core/plugin-catalog-backend-module-aggregator-entity-manager';

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly batchSize = 1000;
  private readonly locationKey: string;
  private readonly emitSchedule = {
    frequency: { seconds: 10 },
    timeout: { minutes: 5 },
  };

  constructor(
    private readonly name: string,
    private readonly service: EntityAggregatorService,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
  ) {
    this.locationKey = `entity-aggregator-provider:id`;
  }

  getProviderName(): string {
    return this.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;

    // Schedule the emit task
    const emitRunner = this.scheduler.createScheduledTaskRunner(this.emitSchedule);
    await emitRunner.run({
      id: `${this.name}-emit-updates`,
      fn: async () => {
        await this.emitUpdatedEntities();
      },
    });
    this.logger.info(`Scheduled entity emission with schedule: ${JSON.stringify(this.emitSchedule)}`);
  }

  private async emitUpdatedEntities(): Promise<void> {
    if (!this.connection) {
      this.logger.warn('No connection available, skipping entity emission');
      return;
    }

    try {
      const mergedRecords = await this.service.getRecordsToEmit(this.batchSize);
      this.logger.info(`Retrieved ${mergedRecords.length} merged entity records to process`);
      
      if (mergedRecords.length === 0) {
        this.logger.debug('No entities to emit');
        return;
      }

      const mutations: DeferredEntity[] = [];
      const processedRefs: string[] = [];

      const totalRecordsProcessed = mergedRecords.length;

      for (const record of mergedRecords) {
        const entityRef = record.entityRef;
        const [kind] = entityRef.split(':');

        record.metadata.annotations = {
          ...record.metadata.annotations,
          "backstage.io/managed-by-origin-location": `entityAggregator://${record.metadata.name}`,
          "backstage.io/managed-by-location": `entityAggregator://${record.metadata.name}`,
        };

        mutations.push({
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind,
            metadata: record.metadata,
            spec: record.spec,
          },
          locationKey: this.locationKey,
        });

        processedRefs.push(entityRef);
      }

      if (mutations.length > 0) {
        this.logger.info(
          `Emitting ${mutations.length} merged entities (from ${totalRecordsProcessed} total records)`
        );
        
        await this.connection.applyMutation({
          type: 'delta',
          added: mutations,
          removed: [],
        });

        await this.service.markEmitted(processedRefs);
        this.logger.debug(`Successfully marked ${processedRefs.length} entities as emitted`);
      } else {
        this.logger.debug('No mutations to emit after processing');
      }
    } catch (error) {
      this.logger.error('Failed to emit updated entities', error as Error);
    }
  }
}