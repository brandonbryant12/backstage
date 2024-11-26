import {
  CatalogProcessor,
  CatalogProcessorEmit,
  LocationSpec,
  CatalogService,
} from '@backstage/plugin-catalog-node';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';

// Helper function to get the location from entity annotations
function getEntitySourceLocation(entity: Entity): string | undefined {
  return entity.metadata.annotations?.['backstage.io/managed-by-location']?.split(':')[1];
}

export class CatalogProviderProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;
  private readonly catalogService: CatalogService;

  constructor(
    logger: LoggerService, 
    catalogService: CatalogService,
  ) {
    this.logger = logger;
    this.catalogService = catalogService;
  }

  getProcessorName(): string {
    return 'CatalogProviderProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    // Check if this entity is from provider-b
    const locationKey = getEntitySourceLocation(entity);
    if (!locationKey?.startsWith('provider-b-')) {
      return entity;
    }

    this.logger.info(`Processing entity from provider-b: ${entity.metadata.name}`);

    try {
      
      const entityRef = stringifyEntityRef({
        kind: entity.kind,
        namespace: entity.metadata.namespace || 'default',
        name: entity.metadata.name,
      });

      const { items } = await this.catalogService.getEntitiesByRefs(
        { entityRefs: [entityRef] },
      );

      // If no matching entity found, return original
      if (items.length === 0) {
        this.logger.info(`No matching entity found for ${entityRef}`);
        return entity;
      }

      const existingEntity = items[0];
      if (!existingEntity) {
        return entity;
      }

      const existingLocation = getEntitySourceLocation(existingEntity);

      // If the existing entity is not from provider-a, return original
      if (!existingLocation?.startsWith('provider-a-')) {
        this.logger.info(`Existing entity not from provider-a: ${existingLocation}`);
        return entity;
      }

      this.logger.info(`Found matching entity from provider-a, merging...`);

      // Merge the entities
      const mergedEntity: Entity = {
        apiVersion: entity.apiVersion,
        kind: entity.kind,
        metadata: {
          ...existingEntity.metadata,
          ...entity.metadata,
          annotations: {
            ...entity.metadata.annotations,
            ...existingEntity.metadata.annotations,
            ...(existingEntity.metadata.annotations?.['backstage.io/managed-by-location'] && {
              'backstage.io/managed-by-location': existingEntity.metadata.annotations['backstage.io/managed-by-location']
            }),
            ...(existingEntity.metadata.annotations?.['backstage.io/managed-by-origin-location'] && {
              'backstage.io/managed-by-origin-location': existingEntity.metadata.annotations['backstage.io/managed-by-origin-location']
            }),
          },
        },
        spec: {
          ...existingEntity.spec,
          ...entity.spec,
        },
      };

      this.logger.info(`Successfully merged entity ${entityRef}`);
      return mergedEntity;

    } catch (error) {
      this.logger.error(`Error processing entity ${entity.metadata.name}: ${error}`);
      return entity;
    }
  }
}
