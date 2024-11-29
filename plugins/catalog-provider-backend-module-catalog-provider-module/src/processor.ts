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
    const existingEntities = await this.catalogClient.getEntities({
      filter: { 'metadata.name': entity.metadata.name },
    });

    if (existingEntities.items.length > 0) {
      const existingEntity = existingEntities.items[0];
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


class CatalogFetchApi {
  constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
  ) {}

  async fetch(input: any, init: RequestInit | undefined): Promise<Response> {
    const request = new Request(input as any, init);
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    request.headers.set('Authorization', `Bearer ${token}`);
    this.logger.debug(`Added token to outgoing request to ${request.url}`);
    return fetch(request);
  }
}