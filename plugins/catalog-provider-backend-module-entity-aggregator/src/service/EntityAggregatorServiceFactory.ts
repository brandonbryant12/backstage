import { createServiceFactory } from '@backstage/backend-plugin-api';
import { entityAggregatorServiceRef } from './EntityAggregatorService';
import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { coreServices } from '@backstage/backend-plugin-api';
import { DatabaseStore } from '../database/DatabaseStore';

/**
 * Default implementation of the entity aggregator service.
 * @public
 */
export const entityAggregatorServiceFactory = createServiceFactory({
  service: entityAggregatorServiceRef,
  deps: {
    logger: coreServices.logger,
    scheduler: coreServices.scheduler,
    database: coreServices.database,
  },
  async factory({ logger, scheduler, database }) {
    const store = await DatabaseStore.create(database, logger);
    return new EntityAggregatorServiceImpl(
      'entity-aggregator',
      store,
      logger,
      scheduler,
    );
  },
}); 