import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { DataSourceA } from './datasources/DataSourceA';
import { DataSourceB } from './datasources/DataSourceB';
import { entityAggregatorService } from './service/EntityAggregatorServiceRef';
import { createRouter } from './router';

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
      },
      async init({ logger, entityAggregator, config, httpRouter }) {
        const isEnabled = config.getOptionalBoolean('entityAggregator.manager.enabled') || false;
        if(!isEnabled) {
          logger.info("Entity Aggregator Manager Disabled");
          return;
        }
        const dataSources = [
          new DataSourceA(
            {
              name: 'datasource-a',
              priority: 100,
              refreshSchedule: {
                frequency: { seconds: 10 },
                timeout: { minutes: 10 },
              },
              ttlSeconds: 60,
            },
            logger,
          ),
          new DataSourceB(
            {
              name: 'datasource-b',
              priority: 50,
              refreshSchedule: {
                frequency: { seconds: 30 },
                timeout: { minutes: 10 },
              },
            },
            logger,
          ),
        ];

        for (const source of dataSources) {
          entityAggregator.addDataSource(source);
        }

        entityAggregator.start();
        logger.info('Entity aggregator started');

        const router = await createRouter({ logger, entityAggregator });
        httpRouter.use(router);
      },
    });
  },
});