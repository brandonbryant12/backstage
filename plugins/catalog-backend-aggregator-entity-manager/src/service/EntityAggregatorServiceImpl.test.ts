import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { RawEntitiesStore } from '../database/RawEntitiesStore';
import { DataSource } from '../datasources/DataSource';
import { mockServices } from '@backstage/backend-test-utils';
import { Entity } from '@backstage/catalog-model';

describe('EntityAggregatorServiceImpl', () => {
  let logger: LoggerService;
  let scheduler: SchedulerService;
  let store: jest.Mocked<RawEntitiesStore>;
  let service: EntityAggregatorServiceImpl;
  let ds: jest.Mocked<DataSource>;

  beforeEach(() => {
    logger = mockServices.logger.mock();
    scheduler = {
      createScheduledTaskRunner: jest.fn().mockReturnValue({
        run: jest.fn(async ({ fn }) => {
          await fn();
        }),
      }),
    } as unknown as SchedulerService;
    store = {
      upsertRecords: jest.fn(),
      getRecordsToEmit: jest.fn().mockResolvedValue([]),
      markEmitted: jest.fn(),
      removeExpiredRecords: jest.fn().mockResolvedValue(0),
      getRecordsByEntityRef: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<RawEntitiesStore>;
    service = new EntityAggregatorServiceImpl('entity-aggregator', store, logger, scheduler);
    ds = {
      getName: jest.fn().mockReturnValue('test'),
      getSchedule: jest.fn(),
      getPriority: jest.fn().mockReturnValue(100),
      refresh: jest.fn(),
      getExpirationDate: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;
  });

  it('adds a data source', () => {
    service.addDataSource(ds);
    expect(logger.debug).toHaveBeenCalledWith('Added data source: test');
  });

  it('starts the service with a scheduled data source', async () => {
    ds.getSchedule.mockReturnValue({ frequency: { seconds: 10 }, timeout: { minutes: 10 } });
    service.addDataSource(ds);
    await service.start();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Scheduled refresh for test'));
    expect(ds.refresh).toHaveBeenCalled();
  });

  it('starts the service with no scheduled data source', async () => {
    service.addDataSource(ds);
    await service.start();
    expect(ds.refresh).not.toHaveBeenCalled();
  });

  it('processEntities handles no entities', async () => {
    ds.getSchedule.mockReturnValue({ frequency: { seconds: 10 }, timeout: { minutes: 10 } });
    ds.refresh.mockResolvedValue();
    service.addDataSource(ds);
    await service.start();
    expect(store.upsertRecords).not.toHaveBeenCalled();
  });

  it('processEntities handles entities', async () => {
    ds.getSchedule.mockReturnValue({ frequency: { seconds: 10 }, timeout: { minutes: 10 } });
    ds.refresh.mockImplementation(async fn => {
      const entities: Entity[] = [{
        kind: 'Component',
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      } as Entity];
      await fn(entities);
    });
    service.addDataSource(ds);
    await service.start();
    expect(store.upsertRecords).toHaveBeenCalledWith([{
      dataSource: 'test',
      entityRef: 'Component:default/test',
      metadata: { name: 'test', namespace: 'default' },
      spec: {},
      priorityScore: 100,
    }]);
  });

  it('gets records to emit', async () => {
    store.getRecordsToEmit.mockResolvedValue([
      [{
        dataSource: 'a',
        entityRef: 'component:default/test',
        metadata: { name: 'test' },
        spec: {},
        priorityScore: 100,
      }]
    ]);
    const records = await service.getRecordsToEmit(10);
    expect(records).toHaveLength(1);
    expect(records[0].entityRef).toBe('component:default/test');
  });

  it('gets no records to emit', async () => {
    store.getRecordsToEmit.mockResolvedValue([]);
    const records = await service.getRecordsToEmit(10);
    expect(records).toHaveLength(0);
  });

  it('marks emitted', async () => {
    await service.markEmitted(['component:default/test']);
    expect(store.markEmitted).toHaveBeenCalledWith(['component:default/test']);
  });

  it('handles empty markEmitted', async () => {
    await service.markEmitted([]);
    expect(store.markEmitted).toHaveBeenCalledWith([]);
  });

  it('gets records by entity ref', async () => {
    store.getRecordsByEntityRef.mockResolvedValue([{
      dataSource: 'a',
      entityRef: 'component:default/test2',
      metadata: { name: 'test2' },
      spec: {},
      priorityScore: 50,
    }]);
    const result = await service.getRecordsByEntityRef('component:default/test2');
    expect(result).toHaveLength(1);
    expect(result[0].entityRef).toBe('component:default/test2');
  });

  it('gets no records by entity ref', async () => {
    store.getRecordsByEntityRef.mockResolvedValue([]);
    const result = await service.getRecordsByEntityRef('component:default/none');
    expect(result).toHaveLength(0);
  });
});
