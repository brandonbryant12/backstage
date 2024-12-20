import { CatalogEntityAggregatorAdminClient } from './CatalogEntityAggregatorAdminClient';
import { ResponseError } from '@backstage/errors';
import { DiscoveryApi } from '@backstage/core-plugin-api';

describe('CatalogEntityAggregatorAdminClient', () => {
  const mockFetch = jest.fn();
  const mockDiscoveryApi: DiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/catalog'),
  };

  const client = new CatalogEntityAggregatorAdminClient({
    discoveryApi: mockDiscoveryApi,
    fetchApi: { fetch: mockFetch },
  });

  it('fetches raw entities for a given entityRef', async () => {
    const mockResponse = {
      entities: [{
        datasource: 'DataSourceA',
        entity: { apiVersion: 'v1', kind: 'Component', metadata: {}, spec: {} }
      }],
      mergedEntity: { apiVersion: 'v1', kind: 'Component', metadata: {}, spec: {} }
    };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const result = await client.getRawEntities('component:default/my-entity');
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('catalog');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7007/api/catalog/raw-entities/default/component/my-entity');
    expect(result).toEqual(mockResponse);
  });

  it('throws ResponseError if response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Not found', { status: 404 }));

    await expect(client.getRawEntities('component:default/unknown'))
      .rejects
      .toThrow(ResponseError);

    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('catalog');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7007/api/catalog/raw-entities/default/component/unknown');
  });
});