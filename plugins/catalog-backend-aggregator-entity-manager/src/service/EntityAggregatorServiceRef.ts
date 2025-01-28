import { 
  createServiceFactory, 
  createServiceRef,
  coreServices 
} from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from './EntityAggregatorService';
import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { EntityFragmentRepository } from '../database/EntityFragmentRepository';

export const entityAggregatorService = createServiceRef<EntityAggregatorService>({
  id: 'entity-aggregator.service',
  scope: 'plugin',
});

export const entityAggregatorServiceFactory = createServiceFactory({
  service: entityAggregatorService,
  deps: {
    logger: coreServices.logger,
    database: coreServices.database,
  },
  async factory({ logger, database }) {
    const repository = await EntityFragmentRepository.create(database, logger);
    return new EntityAggregatorServiceImpl(repository);
  },
});