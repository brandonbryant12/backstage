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
      findEntityGroupsByEntityRef: jest.fn().mockResolvedValue([]),
      markEntitiesAsProcessed: jest.fn(),
      getExpiredRecordEntityRefs: jest.fn().mockResolvedValue([]),
      removeRecords: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
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

    provider = new EntityAggregatorProvider(
      'test-provider',
      mockService,
      mockLogger,
      mockScheduler,
    );
    mockConnection = {
      applyMutation: jest.fn(),
    } as any;
  });

  it('getProviderName returns provider name', () => {
    expect(provider.getProviderName()).toBe('test-provider');
  });

  it('connect schedules processing and purge tasks', async () => {
    await provider.connect(mockConnection);
    expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledTimes(2);
  });

  it('processes entities successfully', async () => {
    const mockTaskRunner = {
      run: jest.fn(async ({ fn }) => {
        await fn();
      }),
    };
    mockScheduler.createScheduledTaskRunner.mockReturnValue(mockTaskRunner);
    
    mockService.findEntityGroupsByEntityRef.mockResolvedValueOnce([[{
      provider_id: 'test-provider',
      entity_ref: 'component:default/test-entity',
      kind: 'Component',
      entity_json: JSON.stringify({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { 
          name: 'test-entity', 
          annotations: {} 
        },
        spec: { type: 'service' },
      }),
      priority: 100,
      content_hash: 'hash1',
      needs_processing: true,
    }]]);

    await provider.connect(mockConnection);
    await mockTaskRunner.run.mock.calls[0][0].fn();

    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: [expect.objectContaining({
        entity: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'test-entity',
            annotations: {
              'backstage.io/managed-by-origin-location': 'entityAggregator://test-entity',
              'backstage.io/managed-by-location': 'entityAggregator://test-entity',
            },
          },
          spec: { type: 'service' },
        },
        locationKey: 'entity-aggregator-provider:id'
      })],
      removed: [],
    });
  });

  it('removes expired records', async () => {
    mockService.getExpiredRecordEntityRefs.mockResolvedValueOnce([
      'component:default/expired',
    ]);

    await provider.connect(mockConnection);
    await (provider as any).removeExpiredRecords();

    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: [],
      removed: [{ 
        entityRef: 'component:default/expired',
        locationKey: 'entity-aggregator-provider:id'
      }],
    });
    expect(mockService.removeRecords).toHaveBeenCalledWith(['component:default/expired']);
  });

  it('logs error when processing entities fails', async () => {
    const mockTaskRunner = {
      run: jest.fn(async ({ fn }) => {
        await fn();
      }),
    };
    mockScheduler.createScheduledTaskRunner.mockReturnValue(mockTaskRunner);
    
    // Mock the service to throw an error
    mockService.findEntityGroupsByEntityRef.mockRejectedValueOnce(new Error('Processing failed'));

    await provider.connect(mockConnection);
    await mockTaskRunner.run.mock.calls[0][0].fn();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to emit updated entities',
      expect.any(Error)
    );
  });

  it('logs error when removing expired records fails', async () => {
    // Mock the service to throw an error
    mockService.getExpiredRecordEntityRefs.mockRejectedValueOnce(new Error('Removal failed'));

    await provider.connect(mockConnection);
    await (provider as any).removeExpiredRecords();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to remove records',
      expect.any(Error)
    );
  });
});