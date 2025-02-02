import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';

export interface CatalogEntityAggregatorAdminApi {
  /**
   * Retrieves raw entities from the aggregator by entityRef
   */
  getRawEntities(entityRef: string): Promise<{
    entities: {
      providerId: string;
      entityRef: string;
      entity: any;
      priority: number;
    }[];
    mergedEntity: any;
  }>;

  /**
   * Lists all entity refs in the aggregator with provider counts
   */
  getAllEntities(): Promise<Array<{ entityRef: string; providerCount: number }>>;
}

export const catalogEntityAggregatorAdminApiRef = createApiRef<CatalogEntityAggregatorAdminApi>({
  id: 'plugin.catalog-entity-aggregator-admin',
});

export class CatalogEntityAggregatorAdminClient implements CatalogEntityAggregatorAdminApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getRawEntities(entityRef: string) {
    const baseUrl = await this.discoveryApi.getBaseUrl('catalog');
    const [kind, namespaceAndName] = entityRef.split(':');
    const [namespace, name] = namespaceAndName.split('/');

    const response = await this.fetchApi.fetch(
      `${baseUrl}/raw-entities/${namespace}/${kind}/${name}`,
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return await response.json() as {
      entities: {
        providerId: string;
        entityRef: string;
        entity: any;
        priority: number;
      }[];
      mergedEntity: any;
    };
  }

  async getAllEntities() {
    const baseUrl = await this.discoveryApi.getBaseUrl('catalog');
    const response = await this.fetchApi.fetch(`${baseUrl}/raw-entities`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return (await response.json()) as Array<{ entityRef: string; providerCount: number }>;
  }
}