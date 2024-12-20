import { EntityAggregatorProvider } from './EntityAggregatorProvider';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';

describe('EntityAggregatorProvider', () => {
  let provider: EntityAggregatorProvider;
  let mockService: any;
  let mockLogger: any;
  let mockScheduler: any;
  let mockConnection: EntityProviderConnection;

  beforeEach(() => {
    mockService = {
      getRecordsToEmit: jest.fn().mockResolvedValue([]),
      markEmitted: jest.fn().mockResolvedValue(undefined),
    };
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const mockTaskRunner = {
      run: jest.fn(async ({ fn }) => {
        await fn();
      }),
    };
    mockScheduler = {
      createScheduledTaskRunner: jest.fn().mockReturnValue(mockTaskRunner),
    };

    provider = new EntityAggregatorProvider('test-provider', mockService, mockLogger, mockScheduler);
    mockConnection = {
      applyMutation: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it('getProviderName returns provider name', () => {
    expect(provider.getProviderName()).toBe('test-provider');
  });

  it('connect schedules tasks', async () => {
    await provider.connect(mockConnection);
    expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Scheduled entity emission'));
  });

  it('emitUpdatedEntities with no connection logs warning', async () => {
    (provider as any).connection = undefined;
    await (provider as any).emitUpdatedEntities();
    expect(mockLogger.warn).toHaveBeenCalledWith('No connection available, skipping entity emission');
  });

  it('emitUpdatedEntities with no records does nothing', async () => {
    await provider.connect(mockConnection);
    mockService.getRecordsToEmit.mockResolvedValueOnce([]);
    await (provider as any).emitUpdatedEntities();
    expect(mockLogger.debug).toHaveBeenCalledWith('No entities to emit');
    expect(mockConnection.applyMutation).not.toHaveBeenCalled();
  });

  it('emitUpdatedEntities with records applies mutations', async () => {
    mockService.getRecordsToEmit.mockResolvedValueOnce([
      {
        entityRef: 'component:default/my-entity',
        metadata: { name: 'my-entity', annotations: {} },
        spec: { foo: 'bar' },
      },
    ]);
    await provider.connect(mockConnection);
    await (provider as any).emitUpdatedEntities();

    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: [
        {
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'my-entity', annotations: { 'backstage.io/managed-by-origin-location': 'entityAggregator://my-entity', 'backstage.io/managed-by-location': 'entityAggregator://my-entity' } },
            spec: { foo: 'bar' },
          },
          locationKey: 'entity-aggregator-provider:id',
        },
      ],
      removed: [],
    });
    expect(mockService.markEmitted).toHaveBeenCalledWith(['component:default/my-entity']);
    expect(mockLogger.debug).toHaveBeenCalledWith('Successfully marked 1 entities as emitted');
  });

  it('emitUpdatedEntities logs error on failure', async () => {
    const error = new Error('Something went wrong');
    mockService.getRecordsToEmit.mockRejectedValueOnce(error);
    await provider.connect(mockConnection);
    await (provider as any).emitUpdatedEntities();
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to emit updated entities', error);
  });
});