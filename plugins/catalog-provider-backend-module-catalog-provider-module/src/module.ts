import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { ProviderA } from './providers/providerA/provider';
import { ProviderB } from './providers/providerB/provider';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';

export const catalogProviderModuleCatalogProviderModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'catalog-provider-module',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ logger, scheduler, catalog }) {
        const providerA = new ProviderA(logger, scheduler.createScheduledTaskRunner({
          frequency: { minutes: 1 },
          timeout: { minutes: 10 },
        }));
        const providerB = new ProviderB(logger, scheduler.createScheduledTaskRunner({
          frequency: { seconds: 1 },
          timeout: { minutes: 10 },
        }));
        
        catalog.addEntityProvider(providerA);
        catalog.addEntityProvider(providerB);
        
        logger.info('Catalog provider module initialized with scheduled tasks');
      },
    });
  },
});
