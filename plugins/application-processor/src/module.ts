import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { CatalogClient } from '@backstage/catalog-client';
import { TestProviderFactory } from './providers/TestProviderFactory';
import { ComponentMergeProcessor } from './processors/ComponentMergeProcessor';
import { LoggerService, AuthService } from "@backstage/backend-plugin-api"

const mockEntityProviderA = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
    annotations: {
      'backstage.io/managed-by-location': 'url:http://example.com/test-entity',
      'backstage.io/managed-by-origin-location': 'url:http://example.com/test-entity',
      'ProviderA': "!!!!!!!"
    },
  },
  spec: {
    type: 'service',
    lifecycle: 'experimental',
    owner: 'team-a',
  },
};

const mockEntityProviderB = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
    annotations: {
      'backstage.io/managed-by-location': 'url:http://example.com/test-entity',
      'backstage.io/managed-by-origin-location': 'url:http://example.com/test-entity',
      'ProviderB': "YOYOYO"
    },
  },
  spec: {
    type: 'service',
    lifecycle: 'experimental',
    owner: 'team-a',
  },
};

export const applicationProcessorModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'application-processor',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({ catalog, logger, scheduler, discovery, auth }) {
        // Create catalog client for the processor
        const catalogClient = new CatalogClient({
          discoveryApi: discovery,
          fetchApi: new CatalogFetchApi(logger, auth)
        });

        // Create and register the merge processor
        const mergeProcessor = new ComponentMergeProcessor(catalogClient, logger);
        catalog.addProcessor(mergeProcessor);
        logger.info('Registered ComponentMergeProcessor');

        // Create the test provider factory
        const factory = TestProviderFactory.create({ logger, scheduler });

        // Create Provider A - runs every 5 minutes
        const providerA = factory.createProvider({
          name: 'provider-a',
          cron: '*/5 * * * *', // Run every 5 minutes
          mockEntities: [mockEntityProviderA],
          annotations: {
            'provider-a/source': 'system-a',
            'provider-a/version': '1.0.0',
          },
        });

        // Create Provider B - runs every 30 seconds, starts after 1 minute
        const providerB = factory.createProvider({
          name: 'provider-b',
          cron: '30 * * * * *', // Run every 30 seconds
          initialDelay: 60000, // 1 minute delay
          mockEntities: [mockEntityProviderB],
          annotations: {
            'provider-b/source': 'system-b',
            'provider-b/version': '2.0.0',
          },
        });

        // Register both providers
        catalog.addEntityProvider(providerA);
        catalog.addEntityProvider(providerB);

        logger.info('Registered test providers A and B');
      },
    });
  },
});

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

