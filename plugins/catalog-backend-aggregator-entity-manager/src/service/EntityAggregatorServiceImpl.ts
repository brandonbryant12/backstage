import { Entity } from '@backstage/catalog-model';
import { EntityFragmentRepository, type EntityFragmentRecord } from '../database/EntityFragmentRepository';
import { EntityAggregatorService } from './EntityAggregatorService';

export class EntityAggregatorServiceImpl implements EntityAggregatorService {

  constructor(
    private readonly repository: EntityFragmentRepository,
  ) {}

  async updateOrCreateEntityFragments(
    providerId: string, 
    entities: Entity[], 
    priority: number, 
    expiresAt: Date
  ): Promise<void> {
    await this.repository.updateOrCreateMany(providerId, entities, priority, expiresAt);
  }

  async getRecordsByEntityRef(entityRef: string): Promise<EntityFragmentRecord[]> {
    return this.repository.getEntityRecordsByEntityRef(entityRef);
  }

  async listEntityRefs(): Promise<Array<{ entityRef: string; providerCount: number }>> {
    return this.repository.listEntityRefs();
  }

  async findEntityGroupsByEntityRef(options: {
    kind?: string;
    needsProcessing?: boolean;
    batchSize?: number;
  }): Promise<EntityFragmentRecord[][]> {
    return this.repository.findEntityGroupsByEntityRef(options);
  }

  async markEntitiesAsProcessed(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;
    await this.repository.markAsProcessed(entityRefs);
  }

  async getExpiredRecordEntityRefs(kind: string): Promise<string[]> {
    return this.repository.getExpiredEntityRefs(kind);
  }

  async removeRecords(entityRefs: string[]): Promise<void> {
    if (!entityRefs.length) return;
    await this.repository.removeByEntityRefs(entityRefs);
  }
}