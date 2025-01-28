import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';
import { mergeRecords } from '@internal/entity-aggregation-common';
import { stringifyEntityRef } from '@backstage/catalog-model';

export class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly locationKey: string;
  private readonly processingSchedule = { frequency: { seconds: 10 }, timeout: { minutes: 5 } };
  private readonly purgeSchedule = { frequency: { seconds: 30 }, timeout: { minutes: 10 } };
  private readonly locationPrefix = 'entityAggregator://'

  constructor(
    private readonly name: string,
    private readonly service: EntityAggregatorService,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
  ) {
    this.locationKey = 'entity-aggregator-provider:id';
  }

  getProviderName(): string {
    return this.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    const emitRunner = this.scheduler.createScheduledTaskRunner(this.processingSchedule);
    await emitRunner.run({
      id: `${this.name}-process-updates`,
      fn: async () => {
        await this.processEntities();
      },
    });
    const purgeRunner = this.scheduler.createScheduledTaskRunner(this.purgeSchedule);
    await purgeRunner.run({
      id: `${this.name}-remove-expired-entities`,
      fn: async () => {
        await this.removeExpiredRecords();
      },
    });
  }

  private async processEntities(): Promise<void> {
    if (!this.connection) return;
    try {
      const needsProcessing = true;
      const kind = 'Component';

      const entityFragmentGroups = await this.service.findEntityGroupsByEntityRef({ 
        kind, 
        needsProcessing 
      });
      const merged = entityFragmentGroups.map((group) => mergeRecords(group));
      if (!merged.length) return;
      const added: DeferredEntity[] = [];
      const processed: string[] = [];
      for (const rec of merged) {
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
        processed.push(stringifyEntityRef(rec));
      }
      await this.connection.applyMutation({ type: 'delta', added, removed: [] });
      await this.service.markEntitiesAsProcessed(processed);

      this.logger.info(`${this.getProviderName()}:added ${added.length} entities to the catalog`);
    } catch (err) {
      this.logger.error('Failed to emit updated entities', err as Error);
    }
  }

  private async removeExpiredRecords(): Promise<void> {
    if (!this.connection) return;
    try {
        const kind = 'Component';
        const entityRefs = await this.service.getExpiredRecordEntityRefs(kind);
        if(!entityRefs.length) return;
        if (entityRefs.length) {
          await this.connection.applyMutation({
            type: 'delta',
            added: [],
            removed: entityRefs.map(ref => ({ 
              entityRef: ref, 
              locationKey: this.locationKey 
            }))
          });
        }
      this.logger.info(`${this.getProviderName()}:removed ${entityRefs.length} entities from the catalog`);
      await this.service.removeRecords(entityRefs);
    } catch (err) {
      this.logger.error('Failed to remove records', err as Error);
    }
  }
}