import request from 'supertest';
import { createRouter } from './router';
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorService } from './service/EntityAggregatorService';
import { mockServices } from '@backstage/backend-test-utils';

describe('router', () => {
  let app: express.Express;
  let logger: LoggerService;
  let entityAggregator: jest.Mocked<EntityAggregatorService>;

  beforeEach(async () => {
    logger = mockServices.logger.mock();

    entityAggregator = {
      addDataSource: jest.fn(),
      start: jest.fn(),
      getRecordsToEmit: jest.fn(),
      markEmitted: jest.fn(),
      getRecordsByEntityRef: jest.fn(),
    } as unknown as jest.Mocked<EntityAggregatorService>;

    const router = await createRouter({ logger, entityAggregator });
    app = express().use(router);
  });

  it('should respond with 200 on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('should return merged entities on /raw-entities', async () => {
    entityAggregator.getRecordsByEntityRef.mockResolvedValue([
      {
        dataSource: 'a',
        entityRef: 'component:default/test',
        metadata: { name: 'test' },
        spec: {},
        priorityScore: 100,
      },
      {
        dataSource: 'b',
        entityRef: 'component:default/test',
        metadata: { name: 'test', annotations: { 'jenkins.io/job-full-name': 'job' } },
        spec: {},
        priorityScore: 50,
      }
    ]);

    const res = await request(app).get('/raw-entities/default/component/test');
    expect(res.status).toBe(200);
    expect(res.body.entities).toHaveLength(2);
    expect(res.body.mergedEntity.metadata.annotations['jenkins.io/job-full-name']).toBe('job');
  });

  it('should return 404 if no records found', async () => {
    entityAggregator.getRecordsByEntityRef.mockResolvedValue([]);
    const res = await request(app).get('/raw-entities/default/component/missing');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/No records found/);
  });
});