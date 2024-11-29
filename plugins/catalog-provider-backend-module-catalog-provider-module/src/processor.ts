import { CatalogProcessor, CatalogProcessorEmit } from '@backstage/plugin-catalog-backend';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';

export class MergeEntitiesProcessor implements CatalogProcessor {
  constructor(private readonly catalogClient: CatalogClient) {}

  getProcessorName(): string {
    return 'MergeEntitiesProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    location: any,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const entityRef = stringifyEntityRef(entity);
    const existingEntity = await this.catalogClient.getEntityByRef(entityRef);

    if (existingEntity) {
      const mergedEntity = {
        ...existingEntity,
        ...entity,
        metadata: {
          ...existingEntity.metadata,
          ...entity.metadata,
        },
        spec: {
          ...existingEntity.spec,
          ...entity.spec,
        },
      };
      return mergedEntity;
    }

    return entity;
  }
}
