import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from './service/EntityAggregatorService';

export interface RouterOptions {
  logger: LoggerService;
  entityAggregator: EntityAggregatorService;
}

export function createRouter({ logger, entityAggregator }: RouterOptions): express.Router {
  const router = express.Router();

  router.get('/aggregator/admin/raw-entities/:namespace/:kind/:name', async (req, res) => {
    const { namespace, kind, name } = req.params;
    const entityRef = `${kind}:${namespace}/${name}`;
    try {
      const data = await entityAggregator.getRawEntitiesAndMerged(entityRef);
      res.status(200).json(data);
    } catch (e) {
      logger.error(`Failed to get raw entities for ${entityRef}`, e as Error);
      res.status(500).json({error: (e as Error).message});
    }
  });

  return router;
}