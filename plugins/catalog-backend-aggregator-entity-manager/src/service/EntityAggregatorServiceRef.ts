import { 
  createServiceFactory, 
  createServiceRef, 
  coreServices 
} from '@backstage/backend-plugin-api';
import { type EntityAggregatorService } from './EntityAggregatorService';
import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { RawEntitiesStore } from '../database/RawEntitiesStore';

export const entityAggregatorService = createServiceRef<EntityAggregatorService>({
  id: 'entity-aggregator.service',
  scope: 'plugin', 
  defaultFactory: async (service) => createServiceFactory({
    service,
    deps: {
      logger: coreServices.logger,
      scheduler: coreServices.scheduler,
      database: coreServices.database,
    },
    async factory({ logger, scheduler, database }) {
      const store = await RawEntitiesStore.create(database, logger);
      return new EntityAggregatorServiceImpl(
        'entity-aggregator',
        store,
        logger,
        scheduler,
      );
    },
  }),
});