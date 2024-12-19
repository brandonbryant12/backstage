import Router from 'express-promise-router';
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from '../src/service/EntityAggregatorService';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { mergeRecords } from './utils/recordMerger';
import { NotFoundError } from '@backstage/errors';
import { errorHandler } from '@backstage/backend-common';

export async function createRouter(
  options: {
    logger: LoggerService,
    entityAggregator: EntityAggregatorService,
  }
): Promise<express.Router> {
  const { logger, entityAggregator } = options;

  const router = Router();
  router.use(express.json());

  router.get('/raw-entities/:namespace/:kind/:name', async (req, res) => {
    const { namespace, kind, name } = req.params;
    const entityRef = stringifyEntityRef({ kind, namespace, name }).charAt(0).toUpperCase() + stringifyEntityRef({ kind, namespace, name }).slice(1);

    const records = await entityAggregator.getRecordsByEntityRef(entityRef);
    if (!records || records.length === 0) {
      throw new NotFoundError(`No records found for entityRef: ${entityRef}`);
    }

    const merged = mergeRecords(records);
    const entities = records.map(r => ({
      datasource: r.dataSource,
      entity: r,
    }));
    
    res.json({
      entities,
      mergedEntity: merged,
    });
  });

  router.use(errorHandler());

  return router;
}