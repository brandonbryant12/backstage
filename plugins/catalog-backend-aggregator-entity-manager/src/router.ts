import Router from 'express-promise-router';
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from '../src/service/EntityAggregatorService';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { mergeRecords } from './utils/recordMerger';

export async function createRouter(
  options: {
    logger: LoggerService,
    entityAggregator: EntityAggregatorService,
  }
): Promise<express.Router> {
  const { logger, entityAggregator } = options;

  const router = Router();
  router.use(express.json())

  router.get('/raw-entities/:namespace/:kind/:name', async (req, res) => {
    const { namespace, kind, name } = req.params;
    const entityRef = stringifyEntityRef({ kind, namespace, name }).charAt(0).toUpperCase() + stringifyEntityRef({ kind, namespace, name }).slice(1);

    try {
      const records = await entityAggregator.getRecordsByEntityRef(entityRef);
      if (!records || records.length === 0) {
        return res.status(404).json({ error: `No records found for entityRef: ${entityRef}` });
      }

      const merged = mergeRecords(records);
      const mergedEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: merged.metadata?.kind ?? kind,
        metadata: merged.metadata,
        spec: merged.spec,
      };

      const entities = records.map(r => ({
        datasource: r.dataSource,
        entity: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: r.metadata?.kind ?? kind,
          metadata: r.metadata,
          spec: r.spec,
        },
      }));
      return res.json({
        entities,
        mergedEntity,
      });
    } catch (error) {
      logger.error('Failed to retrieve raw entities', error as Error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}