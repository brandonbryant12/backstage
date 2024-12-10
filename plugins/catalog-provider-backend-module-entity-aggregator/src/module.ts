import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { DatabaseStore } from './database/DatabaseStore';
import { DataSourceA } from './datasources/DataSourceA';
import { DataSourceB } from './datasources/DataSourceB';
import { EntityAggregatorServiceImpl } from './service/EntityAggregatorServiceImpl';

export const entityAggregatorModule = createBackendModule({
  pluginId: 'catalog-aggregator',
  moduleId: 'entity-manager',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
      },
      async init({ logger, scheduler, database }) {
        logger.info('INIT entity-manager')
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
        logger.info('Registered entity aggregator provider with data sources A and B');
      },
    });
  },
});