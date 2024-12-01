import {
  CatalogProcessor,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';
import { LoggerService } from '@backstage/backend-plugin-api';

export class ComponentMergeProcessor implements CatalogProcessor {
  constructor(
    private readonly catalogClient: CatalogClient,
    private readonly logger: LoggerService,
  ) {}

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

    try {
      this.logger.info(`Processing entity ${stringifyEntityRef(entity)} for potential merge`);
      
      const entityRef = stringifyEntityRef(entity);
      const existingEntity = await this.catalogClient.getEntityByRef(entityRef);

      if (existingEntity) {
        this.logger.info(`Found existing entity for ${entityRef}, merging...`, {
          existingAnnotations: existingEntity.metadata.annotations,
          newAnnotations: entity.metadata.annotations,
        });

        // Remove relations from existing entity as they're handled later in the pipeline
        const sanitizedExistingEntity = this.sanitizeEntity(existingEntity);
        const sanitizedNewEntity = this.sanitizeEntity(entity);

        const mergedEntity = this.mergeEntities(sanitizedExistingEntity, sanitizedNewEntity);

        this.logger.info(`Successfully merged entity ${entityRef}`, {
          mergedAnnotations: mergedEntity.metadata.annotations,
        });

        return mergedEntity;
      }

      this.logger.info(`No existing entity found for ${entityRef}, proceeding with new entity`);
      return this.sanitizeEntity(entity);
    } catch (error) {
      this.logger.error(`Error processing entity ${stringifyEntityRef(entity)}`, error);
      return this.sanitizeEntity(entity);
    }
  }

  private sanitizeEntity(entity: Entity): Entity {
    // Create a shallow copy of the entity
    const sanitized = { ...entity };

    // Remove fields that should not be processed at this stage
    delete (sanitized as any).relations;
    delete (sanitized as any).status;

    return sanitized;
  }

  private mergeEntities(target: Entity, source: Entity): Entity {
    this.logger.debug('Starting entity merge', {
      targetRef: stringifyEntityRef(target),
      sourceRef: stringifyEntityRef(source),
    });

    const merged: Entity = {
      apiVersion: target.apiVersion,
      kind: target.kind,
      metadata: {
        name: target.metadata.name,
        namespace: target.metadata.namespace || 'default',
        // Merge annotations
        annotations: {
          ...target.metadata.annotations,
          ...source.metadata.annotations,
        },
        // Merge labels
        labels: {
          ...target.metadata.labels,
          ...source.metadata.labels,
        },
      },
      spec: target.spec || {},
    };

    // Merge spec fields from source, excluding backstage-managed fields
    if (source.spec) {
      for (const [key, value] of Object.entries(source.spec)) {
        if (!['relations', 'status'].includes(key)) {
          merged.spec[key] = value;
        }
      }
    }

    this.logger.debug('Completed entity merge', {
      mergedAnnotations: merged.metadata.annotations,
      mergedLabels: merged.metadata.labels,
      mergedSpec: merged.spec,
    });

    return merged;
  }
}