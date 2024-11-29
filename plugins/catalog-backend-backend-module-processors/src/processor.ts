import { CatalogProcessor, CatalogProcessorEmit } from '@backstage/plugin-catalog-backend';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';

export class ComponentMergeProcessor implements CatalogProcessor {
  constructor(private readonly catalogClient: CatalogClient) {}

  getProcessorName(): string {
    return 'ComponentMergeProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    location: any,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (entity.kind.toLowerCase() !== 'component') {
      return entity;
    }

    const entityRef = stringifyEntityRef(entity);
    const existingEntity = await this.catalogClient.getEntityByRef(entityRef);

    if (existingEntity) {
      const mergedEntity = this.mergeEntities(existingEntity, entity);
      return mergedEntity;
    }

    return entity;
  }

  private mergeEntities(target: Entity, source: Entity): Entity {
    const merged: Entity = { ...target };

    // Merge metadata.annotations
    merged.metadata.annotations = {
      ...target.metadata.annotations,
      ...source.metadata.annotations,
    };

    // Merge metadata.labels
    merged.metadata.labels = {
      ...target.metadata.labels,
      ...source.metadata.labels,
    };

    // Merge spec fields, excluding those managed by Backstage
    const fieldsToExclude = ['relations', 'status'];
    if(source.spec) {
    for (const key of Object.keys(source.spec || {})) {
      if (!fieldsToExclude.includes(key)) {
        merged.spec = merged.spec || {};
        merged.spec[key] = source.spec[key];
      }
    }
}

    return merged;
  }
} 