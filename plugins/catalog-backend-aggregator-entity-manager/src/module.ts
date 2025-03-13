import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { entityAggregatorService } from './service/EntityAggregatorServiceRef';
import { createRouter } from './router';


export const entityAggregatorManagerModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'entity-aggregator',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        database: coreServices.database,
        entityAggregator: entityAggregatorService,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, entityAggregator, config, httpRouter }) {
        const router = await createRouter({ logger, entityAggregator, config });
        //@ts-ignore
        httpRouter.use(router);
      },
    });
  },
});