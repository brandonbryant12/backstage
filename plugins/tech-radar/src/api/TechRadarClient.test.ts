import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { TechRadarClient } from './TechRadarClient';
import { TechRadarLoaderResponse } from '@backstage-community/plugin-tech-radar-common';

const mockFetchApi: jest.Mocked<FetchApi> = {
  fetch: jest.fn(),
};

const mockDiscoveryApi: jest.Mocked<DiscoveryApi> = {
  getBaseUrl: jest.fn(),
};

const mockOptions = {
  discoveryApi: mockDiscoveryApi,
  fetchApi: mockFetchApi,
};

describe('TechRadarClient', () => {
  let client: TechRadarClient;

  beforeEach(() => {
    jest.resetAllMocks();
    client = new TechRadarClient(mockOptions);
    mockDiscoveryApi.getBaseUrl.mockResolvedValue('http://localhost:7007/api/tech-radar');
  });

  it('should load tech radar data successfully', async () => {
    const mockData: TechRadarLoaderResponse = {
      entries: [
        {
          id: '1',
          quadrant: 'techniques',
          timeline: [{ date: new Date('2023-01-01'), ringId: 'adopt' }],
          key: 'entry1',
          title: 'Entry 1',
        },
      ],
      quadrants: [{ id: 'techniques', name: 'Techniques' }],
      rings: [{ id: 'adopt', name: 'ADOPT', color: '#ff0000' }],
    };

    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as unknown as Response);

    const result = await client.load();

    expect(result).toEqual(mockData);
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('tech-radar');
    expect(mockFetchApi.fetch).toHaveBeenCalledWith('http://localhost:7007/api/tech-radar/data');
  });

  it('should throw an error if fetch fails', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response);

    await expect(client.load()).rejects.toThrow(
      'Failed to fetch Tech Radar data: 500 Internal Server Error',
    );
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('tech-radar');
    expect(mockFetchApi.fetch).toHaveBeenCalledWith('http://localhost:7007/api/tech-radar/data');
  });

  it('should throw an error if data parsing fails', async () => {
    const invalidData = { some: 'invalid structure' };

    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(invalidData),
    } as unknown as Response);

    await expect(client.load()).rejects.toThrow(
      /Failed to parse Tech Radar data:/,
    );
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('tech-radar');
    expect(mockFetchApi.fetch).toHaveBeenCalledWith('http://localhost:7007/api/tech-radar/data');
  });
});
