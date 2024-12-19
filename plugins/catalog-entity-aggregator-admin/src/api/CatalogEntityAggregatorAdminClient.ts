import { CatalogEntityAggregatorAdminApi } from './CatalogEntityAggregatorAdminApi';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';

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

    return await response.json();
  }
} 