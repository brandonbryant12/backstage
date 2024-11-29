import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { ComponentMergeProcessor } from './processor';
import { TestProvider } from './test-provider';
import { CatalogClient } from '@backstage/catalog-client';
import { LoggerService, AuthService } from '@backstage/backend-plugin-api';


// Example test entities that will be provided by different providers
const testEntities = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-service',
      namespace: 'default',
      description: 'Test Service',
      annotations: {
        'backstage.io/managed-by-location': 'url:test-provider',
        'backstage.io/managed-by-origin-location': 'url:test-provider',
      },
      tags: ['test'],
    },
    spec: {
      type: 'service',
      lifecycle: 'test',
      owner: 'test-team',
    },
  },
];


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

export const catalogBackendModuleProcessors = createBackendModule({
  pluginId: 'catalog-backend',
  moduleId: 'processors',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        catalog: catalogProcessingExtensionPoint,
        auth: coreServices.auth,
        discoveryApi: coreServices.discovery,
        scheduler: coreServices.scheduler,
      },
      async init({ logger, catalog, auth, discoveryApi, scheduler }) {
        const fetchApi = new CatalogFetchApi(logger, auth);
        // Initialize the processor
        const catalogClient = new CatalogClient({ discoveryApi, fetchApi });
        const processor = new ComponentMergeProcessor(catalogClient);
        catalog.addProcessor(processor);
        
        // Initialize test providers with different configurations
        const providerA = new TestProvider(
          {
            name: 'source-a',
            entities: testEntities,
            annotations: {
              'source-a/annotation': 'value-a',
              'common/priority': 'primary',
            },
          },
          logger,
          scheduler.createScheduledTaskRunner({
            frequency: { seconds: 10 },
            timeout: { minutes: 1 },
          }),
        );

        const providerB = new TestProvider(
          {
            name: 'source-b',
            entities: testEntities,
            annotations: {
              'source-b/annotation': 'value-b',
              'common/priority': 'secondary',
            },
          },
          logger,
          scheduler.createScheduledTaskRunner({
            frequency: { seconds: 10 },
            timeout: { minutes: 1 },
          }),
        );

        // Add both providers to the catalog
        catalog.addEntityProvider(providerA);
        catalog.addEntityProvider(providerB);

        logger.info('Processors module initialized with test providers');
      },
    });
  },
});
