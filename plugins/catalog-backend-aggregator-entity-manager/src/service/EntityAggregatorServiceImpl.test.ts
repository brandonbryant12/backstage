import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { RawEntitiesStore } from '../database/RawEntitiesStore';
import { DataSource } from '../datasources/DataSource';
import { mockServices } from '@backstage/backend-test-utils/index';

describe('EntityAggregatorServiceImpl', () => {
  let logger: LoggerService;
  let scheduler: SchedulerService;
  let store: jest.Mocked<RawEntitiesStore>;
  let service: EntityAggregatorServiceImpl;

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
  });

  it('adds a data source', () => {
    const ds = { getName: () => 'test', getSchedule: () => undefined } as unknown as DataSource;
    service.addDataSource(ds);
    expect(logger.debug).toHaveBeenCalledWith('Added data source: test');
  });

  it('starts the service', async () => {
    const ds = { 
      getName: () => 'test', 
      getSchedule: () => ({ frequency: { seconds: 10 }, timeout: { minutes: 10 } }), 
      refresh: jest.fn() 
    } as unknown as DataSource;

    service.addDataSource(ds);
    await service.start();

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Scheduled refresh for test'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Scheduled expired records cleanup'));
    expect(ds.refresh).toHaveBeenCalled();
  });

  it('gets records to emit', async () => {
    store.getRecordsToEmit.mockResolvedValue([
      [
        {
          dataSource: 'a',
          entityRef: 'component:default/test',
          metadata: { name: 'test' },
          spec: {},
          priorityScore: 100,
        },
      ]
    ]);
    const records = await service.getRecordsToEmit(10);
    expect(records).toHaveLength(1);
    expect(records[0].entityRef).toBe('component:default/test');
  });

  it('marks emitted', async () => {
    await service.markEmitted(['component:default/test']);
    expect(store.markEmitted).toHaveBeenCalledWith(['component:default/test']);
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
});