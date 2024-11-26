import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { createRouter } from './service/router';
import { CoreProvider } from './provider/CoreProvider';

export const backendCatalogModuleCoreProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'core-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        catalog: catalogProcessingExtensionPoint,
        cache: coreServices.cache,
        http: coreServices.httpRouter,
      },
      async init({ logger, scheduler, catalog, cache, http }) {
        const provider = new CoreProvider(
          logger,
          scheduler.createScheduledTaskRunner({
            frequency: { seconds: 10 },
            timeout: { minutes: 1 },
          }),
          cache,
        );
        
        catalog.addEntityProvider(provider);
        
        // Add router with endpoint for entity updates
        const router = await createRouter({
          logger,
          provider,
        });
        
        http.use(router);
        
        logger.info('Initialized core provider module');
      },
    });
  },
});
