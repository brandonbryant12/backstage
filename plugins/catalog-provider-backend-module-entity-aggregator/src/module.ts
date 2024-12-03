import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { DatabaseStore } from './database/DatabaseStore';
import { DataSourceA } from './datasources/DataSourceA';
import { DataSourceB } from './datasources/DataSourceB';
import { EntityAggregatorProvider } from './provider/EntityAggregatorProvider';

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
        // Initialize the database store
        const store = await DatabaseStore.create(database, logger);
        
        // Initialize data sources with different priorities and refresh schedules
        const dataSources = [
          new DataSourceA(
            { 
              name: 'datasource-a', 
              priority: 100,
              refreshSchedule: '*/1 * * * *', // Every 1 minute
            }, 
            logger,
            scheduler
          ),
          new DataSourceB(
            { 
              name: 'datasource-b', 
              priority: 50,
              refreshSchedule: '*/2 * * * *', // Every 2 minutes
            }, 
            logger,
            scheduler
          ),
        ];

        // Create the entity aggregator provider
        const provider = new EntityAggregatorProvider(
          'entity-aggregator',
          store,
          logger,
          dataSources,
        );

        // Register the provider with the catalog
        catalog.addEntityProvider(provider);

        logger.info('Registered entity aggregator provider with data sources A and B');
      },
    });
  },
});