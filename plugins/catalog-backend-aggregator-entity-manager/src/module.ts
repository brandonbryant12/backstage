import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { entityAggregatorService } from './service/EntityAggregatorServiceRef';
import { createRouter } from './router';
import { GithubDataSource } from './datasources/github/GithubDataSource';

export const entityAggregatorModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'entity-aggregator',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
        entityAggregator: entityAggregatorService,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        urlReader: coreServices.urlReader,
      },
      async init({ logger, entityAggregator, config, httpRouter, urlReader }) {
        const isEnabled = config.getOptionalBoolean('entityAggregator.manager.enabled') || true;
        if(!isEnabled) {
          logger.info("Entity Aggregator Manager Disabled");
          return;
        }

        const dataSources = [
          new GithubDataSource(
            {
              name: 'github-datasource',
              priority: 80,
              refreshSchedule: {
                frequency: { seconds: 60 },
                timeout: { minutes: 5 },
              },
            },
            logger,
            urlReader,
          ),
        ];

        for (const source of dataSources) {
          entityAggregator.addDataSource(source);
        }

        entityAggregator.start();
        logger.info('Entity aggregator started');

        const router = await createRouter({ logger, entityAggregator, config });
        httpRouter.use(router);
      },
    });
  },
});