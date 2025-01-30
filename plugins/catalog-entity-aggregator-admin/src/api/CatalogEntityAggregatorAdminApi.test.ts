import { CatalogEntityAggregatorAdminClient } from './CatalogEntityAggregatorAdminApi';
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches raw entities for a given entityRef', async () => {
    const mockResponse = {
      entities: [
        {
          providerId: 'provider-a',
          entityRef: 'component:default/my-entity',
          entity: { apiVersion: 'v1', kind: 'Component', metadata: {}, spec: {} },
          priority: 1,
        },
      ],
      mergedEntity: { apiVersion: 'v1', kind: 'Component', metadata: {}, spec: {} },
    };

    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const result = await client.getRawEntities('component:default/my-entity');
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('catalog');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7007/api/catalog/raw-entities/default/component/my-entity',
    );
    expect(result).toEqual(mockResponse);
  });

  it('fetches all entities', async () => {
    const mockResponse = [
      { entityRef: 'component:default/service-a', providerCount: 2 },
      { entityRef: 'component:default/service-b', providerCount: 3 },
    ];

    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const result = await client.getAllEntities();
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('catalog');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7007/api/catalog/raw-entities');
    expect(result).toEqual(mockResponse);
  });
});