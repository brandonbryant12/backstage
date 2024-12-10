import {
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
} from '@backstage/plugin-catalog-node';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SchedulerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from '../service/EntityAggregatorService';
import { EntityRecord } from '../types';

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

  private mergeRecords(records: EntityRecord[]): EntityRecord {
    const sortedRecords = [...records].sort((a, b) => b.priorityScore - a.priorityScore);
    const highestPriorityRecord = sortedRecords[0];

    const mergedRecord = {
      ...highestPriorityRecord,
      metadata: {
        ...highestPriorityRecord.metadata,
        annotations: {} as Record<string, string>,
      },
    };

    const allKeys = new Set(
      sortedRecords.flatMap(r => Object.keys(r.metadata.annotations || {}))
    );

    allKeys.forEach(key => {
      for (const record of sortedRecords) {
        const annotations = record.metadata.annotations || {};
        if (key in annotations) {
          mergedRecord.metadata.annotations[key] = annotations[key];
          break;
        }
      }
    });
    return mergedRecord;
  }

  private async emitUpdatedEntities(): Promise<void> {
    if (!this.connection) {
      this.logger.warn('No connection available, skipping entity emission');
      return;
    }
    
    try {
      const entityGroups = await this.service.getRecordsToEmit(this.batchSize);
      if (entityGroups.length === 0) {
        return;
      }

      const mutations: DeferredEntity[] = [];
      const processedRefs: string[] = [];

      for (const records of entityGroups) {
        if (!records.length) continue;
        
        const entityRef = records[0].entityRef;
        const [kind] = entityRef.split(':');
        
        const mergedRecord = this.mergeRecords(records);
        
        mergedRecord.metadata.annotations = {
          ...mergedRecord.metadata.annotations,
          "backstage.io/managed-by-origin-location": `entityAggregator://${mergedRecord.metadata.name}`,
          "backstage.io/managed-by-location": `entityAggregator://${mergedRecord.metadata.name}`,
        };

        mutations.push({
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind,
            metadata: mergedRecord.metadata,
            spec: mergedRecord.spec,
          },
          locationKey: this.locationKey,
        });
        
        processedRefs.push(entityRef);
      }

      if (mutations.length > 0) {
        await this.connection.applyMutation({
          type: 'delta',
          added: mutations,
          removed: [],
        });

        await this.service.markEmitted(processedRefs);
      }
    } catch (error) {
      this.logger.error('Failed to emit updated entities', error as Error);
    }
  }
}