import { CatalogProcessor, CatalogProcessorResult } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { CatalogClient } from '@backstage/catalog-client';
import { LoggerService, AuthService } from '@backstage/backend-plugin-api';

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

export class ApplicationProcessor implements CatalogProcessor {
  constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
    private readonly discoveryApi: { getBaseUrl(plugin: string): Promise<string> },
  ) {}

  getProcessorName(): string {
    return 'ApplicationProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    return entity.kind === 'Component';
  }

  async preProcessEntity(
    entity: Entity,
    _location: any, // You might want to type this properly
  ): Promise<Entity> {
    const catalogClient = new CatalogClient({
      discoveryApi: this.discoveryApi,
      fetchApi: new CatalogFetchApi(this.logger, this.auth),
    });

    try {
      const result = await catalogClient.getEntities({
        filter: {
          kind: 'Component',
          'metadata.name': entity.metadata.name,
        },
      });

      this.logger.info(
        `Entity ${entity.metadata.name} exists: ${result.items.length > 0}`,
      );
    } catch (error) {
      this.logger.error(
        `Error checking existence of entity ${entity.metadata.name}`,
        error,
      );
    }

    return entity;
  }
}