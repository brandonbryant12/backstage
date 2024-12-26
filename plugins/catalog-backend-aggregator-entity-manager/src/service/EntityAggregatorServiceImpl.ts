import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { DataSource } from '../datasources/DataSource';
import { RawEntitiesStore } from '../database/RawEntitiesStore';
import { EntityRecord } from '../types';
import { JsonObject } from '@backstage/types';
import { EntityAggregatorService } from './EntityAggregatorService';
import { mergeRecords } from '../utils/recordMerger';

export class EntityAggregatorServiceImpl implements EntityAggregatorService {
  private readonly dataSources: DataSource[] = [];

  constructor(
    private readonly store: RawEntitiesStore,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
  ) {}

  addDataSource(source: DataSource): void {
    this.dataSources.push(source);
  }

  start(): void {
    for (const source of this.dataSources) {
      const schedule = source.getSchedule();
      if (schedule) {
        const runner = this.scheduler.createScheduledTaskRunner(schedule);
        runner.run({
          id: `datasource-refresh-${source.getName()}`,
          fn: async () => {
            const entities = new Array<Entity>();
            await source.refresh(async e => {
              entities.push(...e);
            });
            await this.processEntities(source, entities);
          },
        });
      }
    }
  }

  private async processEntities(source: DataSource, entities: Entity[]): Promise<void> {
    const ttl = source.getConfig().ttlSeconds;
    let expirationDate: Date | undefined;
    if (ttl && ttl > 0) {
      expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + ttl);
    }
    const records: EntityRecord[] = entities.map(entity => ({
      dataSource: source.getName(),
      entityRef: this.getEntityRef(entity),
      metadata: entity.metadata,
      spec: entity.spec || ({} as JsonObject),
      priorityScore: source.getPriority(),
      expirationDate,
    }));
    await this.store.upsertRecords(records);
    this.logger.info(`Processed ${entities.length} entities from data source ${source.getName()}`);
  }

  private getEntityRef(entity: Entity): string {
    const kind = entity.kind.toLowerCase();
    const namespace = (entity.metadata.namespace || 'default').toLowerCase();
    const name = entity.metadata.name.toLowerCase();
    return `${kind}:${namespace}/${name}`;
  }

  async getRecordsToEmit(batchSize: number): Promise<EntityRecord[]> {
    const entityGroups = await this.store.getRecordsToEmit(batchSize);
    const merged = entityGroups.map(r => mergeRecords(r));
    return merged;
  }

  async markEmitted(entityRefs: string[]): Promise<void> {
    await this.store.markEmitted(entityRefs);
  }

  async getRecordsByEntityRef(entityRef: string): Promise<EntityRecord[]> {
    return this.store.getRecordsByEntityRef(entityRef);
  }

  async listEntityRefs(): Promise<Array<{ entityRef: string; dataSourceCount: number }>> {
    return this.store.listEntityRefs();
  }

  async getInvalidEntityRefs(entityRefs: string[]): Promise<string[]> {
    const withValidRecord = await this.store.getEntityRecordsByEntityRefs(entityRefs);
    return entityRefs.filter(ref => !withValidRecord.includes(ref));
  }

  removeExpiredRecords(): Promise<number> {
    return this.store.removeExpiredRecords();
  }
}