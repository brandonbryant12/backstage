import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { EntityAggregatorProvider } from './provider/EntityAggregatorProvider';
import { entityAggregatorService } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';

export const catalogModuleProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
        entityAggregator: entityAggregatorService,
      },
      async init({ entityAggregator, logger, scheduler, catalog }) {
        // Initialize the provider
        const provider = new EntityAggregatorProvider(
          'entity-aggregator',
          entityAggregator,
          logger,
          scheduler,
        );

        catalog.addEntityProvider(provider);
        logger.info('Registered entity aggregator provider');
      },
    });
  },
});