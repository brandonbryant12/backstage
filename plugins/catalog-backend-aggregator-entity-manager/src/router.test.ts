import request from 'supertest';
import express from 'express';
import { createRouter } from './router';
import { EntityAggregatorService } from './service/EntityAggregatorService';
import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';

describe('router', () => {
  let app: express.Express;
  let logger: ReturnType<typeof mockServices.logger.mock>;
  let entityAggregator: jest.Mocked<EntityAggregatorService>;
  let config: ConfigReader;

  beforeEach(async () => {
    logger = mockServices.logger.mock();
    config = new ConfigReader({});
    entityAggregator = {
      updateOrCreateEntityFragments: jest.fn(),
      getRecordsByEntityRef: jest.fn(),
      listEntityRefs: jest.fn(),
      findEntityGroupsByEntityRef: jest.fn(),
      markEntitiesAsProcessed: jest.fn(),
      getExpiredRecordEntityRefs: jest.fn(),
      removeRecords: jest.fn(),
    } as jest.Mocked<EntityAggregatorService>;

    const router = await createRouter({ logger, entityAggregator, config });
    app = express().use(router);
  });

  it('should respond with 200 on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('should list entity refs on /raw-entities', async () => {
    entityAggregator.listEntityRefs.mockResolvedValue([
      { entityRef: 'component:default/test', providerCount: 2 },
      { entityRef: 'api:default/api1', providerCount: 1 },
    ]);

    const res = await request(app).get('/raw-entities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { entityRef: 'component:default/test', providerCount: 2 },
      { entityRef: 'api:default/api1', providerCount: 1 },
    ]);
  });

  it('should return entity records on /raw-entities/:namespace/:kind/:name', async () => {
    entityAggregator.getRecordsByEntityRef.mockResolvedValue([
      {
        provider_id: 'provider-1',
        entity_ref: 'component:default/test',
        kind: 'Component',
        entity_json: JSON.stringify({ metadata: { name: 'test' }, spec: {} }),
        priority: 100,
        content_hash: 'hash1',
        needs_processing: false,
      },
    ]);

    const res = await request(app).get('/raw-entities/default/component/test');
    expect(res.status).toBe(200);
    expect(res.body.entities).toHaveLength(1);
    expect(res.body.entities[0]).toEqual({
      providerId: 'provider-1',
      entity: { metadata: { name: 'test' }, spec: {} },
      priority: 100
    });
    expect(res.body.mergedEntity).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      metadata: {
        name: 'test',
        annotations: {},
      },
      spec: {},
    });
  });

  it('should return 404 if no records found', async () => {
    entityAggregator.getRecordsByEntityRef.mockResolvedValue([]);
    const res = await request(app).get('/raw-entities/default/component/missing');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/No records found/);
  });
});