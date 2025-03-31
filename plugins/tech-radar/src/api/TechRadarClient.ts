import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { TechRadarApi } from '@backstage-community/plugin-tech-radar';
import {
  TechRadarLoaderResponse,
  TechRadarLoaderResponseParser,
} from '@backstage-community/plugin-tech-radar-common';

export interface TechRadarClientOptions {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}

export class TechRadarClient implements TechRadarApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: TechRadarClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async load(): Promise<TechRadarLoaderResponse> {
    const backendBaseUrl = await this.discoveryApi.getBaseUrl('tech-radar');
    const response = await this.fetchApi.fetch(`${backendBaseUrl}/data`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Tech Radar data: ${response.status} ${response.statusText}`,
      );
    }

    const rawData = await response.json();

    const validationResult = TechRadarLoaderResponseParser.safeParse(rawData);

    if (!validationResult.success) {
       throw new Error(
        `Failed to parse Tech Radar data: ${validationResult.error.message}`,
       );
    }

    return validationResult.data;
  }
}