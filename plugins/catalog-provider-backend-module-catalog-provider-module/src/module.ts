import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { ProviderA } from './providers/providerA/provider';
import { ProviderB } from './providers/providerB/provider';
import { CatalogProviderProcessor } from './processor';
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
        catalogService: catalogServiceRef,
        tokenManager: coreServices.tokenManager,
      },
      async init({ logger, scheduler, catalog, catalogService, tokenManager }) {
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
        
        const processor = new CatalogProviderProcessor(logger, catalogService, tokenManager);
        catalog.addProcessor(processor);
        
        logger.info('Catalog provider module initialized with scheduled tasks');
      },
    });
  },
});
