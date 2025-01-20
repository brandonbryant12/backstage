import { EntityStagingService, StagingEntityInput, MergedEntity } from './EntityStagingService';
import { StagingEntitiesStore } from '../database/StagingEntitiesStore';
import { LoggerService } from '@backstage/backend-plugin-api';

export class EntityStagingServiceImpl implements EntityStagingService {
  constructor(
    private readonly store: StagingEntitiesStore,
    private readonly logger: LoggerService,
  ) {}

  async upsertRecords(
    providerId: string,
    entities: StagingEntityInput[],
    priority: number,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.store.upsertMultiple(providerId, entities, priority, ttlSeconds);
    this.logger.debug(`Upserted ${entities.length} records for provider=${providerId}`);
  }

  async getRecords(options?: {
    providerIds?: string[];
    onlyChanged?: boolean;
    entityRefs?: string[];
    limit?: number;
  }) {
    return this.store.getRecords(options);
  }

  async markProcessed(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;
    await this.store.markProcessed(entityRefs);
    this.logger.debug(`Marked processed for ${entityRefs.length} entityRefs`);
  }

  async removeRecords(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;
    await this.store.removeRecords(entityRefs);
    this.logger.debug(`Removed records for ${entityRefs.length} entityRefs`);
  }

  async mergeRecords(entityRef: string): Promise<MergedEntity | null> {
    const merged = await this.store.mergeRecords(entityRef);
    return merged;
  }

  async purgeExpiredRecords(): Promise<number> {
    const count = await this.store.purgeExpired();
    return count;
  }
}