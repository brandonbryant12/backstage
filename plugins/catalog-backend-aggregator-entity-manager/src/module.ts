import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { DataSourceA } from './datasources/DataSourceA';
import { DataSourceB } from './datasources/DataSourceB';
import { entityAggregatorService } from './service/EntityAggregatorServiceRef';

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
        // Removed httpRouter dependency from here since we won't mount route here
      },
      async init({ logger, entityAggregator, config }) {
        const isEnabled = config.getOptionalBoolean('entityAggregator.enabled') || false;
        if(!isEnabled) {
          logger.info("Entity Aggregator Disabled");
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
      },
    });
  },
});