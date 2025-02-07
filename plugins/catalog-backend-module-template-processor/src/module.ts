import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { CatalogClient } from '@backstage/catalog-client';
import { TemplateTimestampProcessor } from './processor';
import { LoggerService, AuthService } from '@backstage/backend-plugin-api';

class CatalogFetchApi {
  constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
  ) {}

  async fetch(input: RequestInfo | URL, init: RequestInit | undefined): Promise<Response> {
    const request = new Request(input, init);
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    request.headers.set('Authorization', `Bearer ${token}`);
    this.logger.debug(`Added token to outgoing request to ${request.url}`);
    return fetch(request);
  }
}

export const catalogModuleTemplateProcessor = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'template-processor',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({
        logger,
        discovery,
        auth,
        catalog,
      }: {
        logger: LoggerService;
        discovery: any;
        auth: AuthService;
        catalog: any;
      }) {
        logger.info('Registering TemplateTimestampProcessor');

        // Create an authenticated fetch API for catalog requests.
        const fetchApi = new CatalogFetchApi(logger, auth);

        // Instantiate the CatalogClient with discoveryApi and the authenticated fetchApi.
        const catalogClient: CatalogClient = new CatalogClient({
          discoveryApi: discovery,
          fetchApi,
        });

        // Register our custom processor with the logger
        catalog.addProcessor(new TemplateTimestampProcessor(catalogClient, logger));
      },
    });
  },
});