import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { EntityAggregatorProvider } from './provider/EntityAggregatorProvider';
import { entityAggregatorService } from '@backstage/plugin-catalog-provider-backend-module-entity-aggregator';

export const catalogModuleProvider = createBackendModule({
  pluginId: 'catalog-aggregator',
  moduleId: 'provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        // aggregator: entityAggregatorService,
      },
      async init({ catalog, logger, scheduler, aggregator }) {
        // Initialize the provider
        const provider = new EntityAggregatorProvider(
          'entity-aggregator',
          aggregator,
          logger,
          scheduler,
        );

        catalog.addEntityProvider(provider);
        logger.info('Registered entity aggregator provider');
      },
    });
  },
});
