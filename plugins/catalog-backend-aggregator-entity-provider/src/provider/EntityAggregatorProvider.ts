import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { LoggerService, SchedulerService, DatabaseService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';
import { FinalEntitiesDataStore } from './FinalEntitiesDataStore';

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly batchSize = 1000;
  private readonly locationKey: string;
  private readonly emitSchedule = { frequency: { seconds: 10 }, timeout: { minutes: 5 } };
  private readonly purgeSchedule = { frequency: { seconds: 30 }, timeout: { minutes: 10 } };
  private readonly locationPrefix = 'entityAggregator://'

  constructor(
    private readonly name: string,
    private readonly service: EntityAggregatorService,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
    private readonly db: DatabaseService,
  ) {
    this.locationKey = 'entity-aggregator-provider:id';
  }

  getProviderName(): string {
    return this.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    const emitRunner = this.scheduler.createScheduledTaskRunner(this.emitSchedule);
    await emitRunner.run({
      id: `${this.name}-emit-updates`,
      fn: async () => {
        await this.emitUpdatedEntities();
      },
    });
    const purgeRunner = this.scheduler.createScheduledTaskRunner(this.purgeSchedule);
    await purgeRunner.run({
      id: `${this.name}-purge-expired`,
      fn: async () => {
        await this.purgeExpiredRecords();
      },
    });
  }

  private async emitUpdatedEntities(): Promise<void> {
    if (!this.connection) return;
    try {
      const merged = await this.service.getRecordsToEmit(this.batchSize);
      if (!merged.length) return;
      const added: DeferredEntity[] = [];
      const processed: string[] = [];
      for (const rec of merged) {
        const [kind] = rec.entityRef.split(':');
        rec.metadata.annotations = {
          ...rec.metadata.annotations,
          'backstage.io/managed-by-origin-location': `${this.locationPrefix}${rec.metadata.name}`,
          'backstage.io/managed-by-location': `${this.locationPrefix}${rec.metadata.name}`,
        };
        added.push({
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: kind[0].toUpperCase() + kind.slice(1),
            metadata: rec.metadata,
            spec: rec.spec,
          },
          locationKey: this.locationKey,
        });
        processed.push(rec.entityRef);
      }
      await this.connection.applyMutation({ type: 'delta', added, removed: [] });
      await this.service.markEmitted(processed);
      this.logger.info(`Emitted ${added.length} entities to the catalog`);
    } catch (err) {
      this.logger.error('Failed to emit updated entities', err as Error);
    }
  }

  private async purgeExpiredRecords(): Promise<void> {
    if (!this.connection) return;
    try {
      const store = new FinalEntitiesDataStore(this.db);
      const limit = 1000;
      let offset = 0;
      let totalRemoved = 0;
      let hasRecordsToCheck = true;
      while (hasRecordsToCheck) {
        const { items } = await store.queryByLocation(this.locationPrefix, offset, limit);
        
        if (items.length === 0) {
          hasRecordsToCheck = false;
          break;
        }

        const refs = items.map(row => row.entity_ref.toLowerCase());
        const invalidRefs = await this.service.getInvalidEntityRefs(refs);

        if (invalidRefs.length) {
          await this.connection.applyMutation({
            type: 'delta',
            added: [],
            removed: invalidRefs.map(ref => ({ 
              entityRef: ref, 
              locationKey: this.locationKey 
            }))
          });
          totalRemoved += invalidRefs.length;
        }

        offset += items.length;
      }

      if (totalRemoved > 0) {
        this.logger.info(`Purged ${totalRemoved} invalid entities from the catalog`);
      }
    } catch (err) {
      this.logger.error('Failed to purge expired records', err as Error);
    }
  }
}