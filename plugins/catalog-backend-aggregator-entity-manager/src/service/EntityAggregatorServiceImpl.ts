import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { DataSource } from '../datasources/DataSource';
import { DatabaseStore } from '../database/DatabaseStore';
import { EntityRecord } from '../types';
import { JsonObject } from '@backstage/types';
import { EntityAggregatorService } from './EntityAggregatorService';

export class EntityAggregatorServiceImpl implements EntityAggregatorService {
  private readonly cleanupSchedule = {
    frequency: { seconds: 10 },
    timeout: { minutes: 5 },
  };

  private readonly dataSources: DataSource[] = [];

  constructor(
    private readonly name: string,
    private readonly store: DatabaseStore,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
  ) {
    this.logger.debug(`Initialized entity aggregator service`);
  }

  addDataSource(source: DataSource): void {
    this.dataSources.push(source);
    this.logger.debug(`Added data source: ${source.getName()}`);
  }

  async start(): Promise<void> {
    for (const source of this.dataSources) {
      const schedule = source.getSchedule();
      if (schedule) {
        const runner = this.scheduler.createScheduledTaskRunner(schedule);
        await runner.run({
          id: `datasource-refresh-${source.getName()}`,
          fn: async () => {
            await source.refresh(entities => this.processEntities(source, entities));
          },
        });
        this.logger.info(
          `Scheduled refresh for ${source.getName()} with schedule: ${JSON.stringify(schedule)}`,
        );
      }
    }

    const cleanupRunner = this.scheduler.createScheduledTaskRunner(this.cleanupSchedule);
    await cleanupRunner.run({
      id: `${this.name}-cleanup-expired`,
      fn: async () => {
        try {
          const removedCount = await this.store.removeExpiredRecords();
          if (removedCount > 0) {
            this.logger.info(`Cleanup task completed: removed ${removedCount} expired records`);
          }
        } catch (error) {
          this.logger.error('Failed to cleanup expired records', error as Error);
        }
      },
    });
    this.logger.info(`Scheduled expired records cleanup with schedule: ${JSON.stringify(this.cleanupSchedule)}`);
  }

  private async processEntities(source: DataSource, entities: Entity[]): Promise<void> {
    try {
      this.logger.info(`Starting to process ${entities.length} entities from ${source.getName()}`);
      const entityRecords: EntityRecord[] = entities.map(entity => ({
        dataSource: source.getName(),
        entityRef: this.getEntityRef(entity),
        metadata: entity.metadata,
        spec: entity.spec || {} as JsonObject,
        priorityScore: source.getPriority(),
        expirationDate: source.getExpirationDate?.(),
      }));
      await this.store.upsertRecords(entityRecords);
      this.logger.info(`Processed ${entities.length} entities from ${source.getName()}`);
      
    } catch (error) {
      this.logger.error(
        `Failed to process entities from ${source.getName()}`,
        error as JsonObject,
      );
    }
  }

  private getEntityRef(entity: Entity): string {
    try {
      return `${entity.kind}:${entity.metadata.namespace || 'default'}/${entity.metadata.name}`;
    } catch (error) {
      this.logger.error(`Failed to generate entityRef for entity`, error as Error);
      return `unknown:default/error-${Date.now()}`;
    }
  }

  async getRecordsToEmit(batchSize: number): Promise<EntityRecord[][]> {
    return this.store.getRecordsToEmit(batchSize);
  }

  async markEmitted(entityRefs: string[]): Promise<void> {
    await this.store.markEmitted(entityRefs);
  }

  async getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]> {
    return this.store.getRecordsByEntityRef(entityRef);
  }
} 