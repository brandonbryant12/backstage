import Router from 'express-promise-router';
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from '../src/service/EntityAggregatorService';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { Config } from '@backstage/config';

export async function createRouter(options: {
  logger: LoggerService;
  entityAggregator: EntityAggregatorService;
  config: Config;
}): Promise<express.Router> {
  const { entityAggregator, logger, config } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  /**
   * Returns list of entityRefs with dataSource counts
   */
  router.get('/raw-entities', async (_req, res) => {
    const results = await entityAggregator.listEntityRefs();
    res.json(results);
  });

  router.get('/raw-entities/:namespace/:kind/:name', async (req, res) => {
    const { namespace, kind, name } = req.params;
    const entityRef = stringifyEntityRef({ kind, namespace, name });

    const records = await entityAggregator.getRecordsByEntityRef(entityRef);
    if (!records || records.length === 0) {
      throw new NotFoundError(`No records found for entityRef: ${entityRef}`);
    }

    const entities = records.map(r => ({
      providerId: r.provider_id,
      entityRef: r.entity_ref,
      entity: JSON.parse(r.entity_json),
    }));

    res.json({ entities });
  });

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}