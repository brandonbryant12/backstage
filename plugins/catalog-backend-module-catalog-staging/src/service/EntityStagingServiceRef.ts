import {
  createServiceFactory,
  createServiceRef,
  coreServices,
} from '@backstage/backend-plugin-api';
import { EntityStagingServiceImpl } from './EntityStagingServiceImpl';
import { StagingEntitiesStore } from '../database/StagingEntitiesStore';
import { EntityStagingService } from './EntityStagingService';

export const entityStagingServiceRef = createServiceRef<EntityStagingService>({
  id: 'catalog-staging.service',
  scope: 'plugin',
  defaultFactory: async service => 
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
      },
      async factory({ logger, database }) {
        const store = await StagingEntitiesStore.create(database, logger);
        return new EntityStagingServiceImpl(store, logger);
      },
    }),
});