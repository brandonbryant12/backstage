import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { DatabaseStore } from './database/DatabaseStore';
import { DataSourceA } from './datasources/DataSourceA';
import { DataSourceB } from './datasources/DataSourceB';
import { EntityAggregatorProvider } from './provider/EntityAggregatorProvider';
import { EntityAggregatorServiceImpl } from './service/EntityAggregatorServiceImpl';

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
      },
      async init({ catalog, logger, scheduler, database }) {
        const store = await DatabaseStore.create(database, logger);
        
        // Create service instance
        const service = new EntityAggregatorServiceImpl(
          'entity-aggregator',
          store,
          logger,
          scheduler,
        );

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

        // Add data sources to service
        for (const source of dataSources) {
          service.addDataSource(source);
        }
        await service.start();

        // Initialize the provider with the service
        const provider = new EntityAggregatorProvider(
          'entity-aggregator',
          service,
          logger,
          scheduler,
        );

        catalog.addEntityProvider(provider);
        logger.info('Registered entity aggregator provider with data sources A and B');
      },
    });
  },
});