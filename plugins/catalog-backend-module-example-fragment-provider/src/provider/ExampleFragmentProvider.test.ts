import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import { ExampleFragmentProvider } from './ExampleFragmentProvider';
import { EntityAggregatorService } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';
import { generateMockEntities } from './mockEntityFactory';

describe('ExampleFragmentProvider', () => {
  let entityAggregatorService: jest.Mocked<EntityAggregatorService>;
  let loggerService: jest.Mocked<LoggerService>;
  let schedulerService: jest.Mocked<SchedulerService>;
  let provider: ExampleFragmentProvider;
  let mockTaskRunner: { run: jest.Mock };

  beforeEach(() => {
    entityAggregatorService = {
      updateOrCreateEntityFragments: jest.fn(),
    } as unknown as jest.Mocked<EntityAggregatorService>;

    loggerService = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockTaskRunner = {
      run: jest.fn(),
    };

    schedulerService = {
      createScheduledTaskRunner: jest.fn().mockReturnValue(mockTaskRunner),
    } as unknown as jest.Mocked<SchedulerService>;

    provider = new ExampleFragmentProvider(
      entityAggregatorService,
      loggerService,
      schedulerService,
    );
  });

  it('creates and starts a scheduled task runner', async () => {
    await provider.start();

    expect(schedulerService.createScheduledTaskRunner).toHaveBeenCalledWith({
      frequency: { minutes: 2 },
      timeout: { minutes: 5 },
    });

    expect(mockTaskRunner.run).toHaveBeenCalledWith({
      id: 'example-fragment-provider-refresh',
      fn: expect.any(Function),
    });
  });

  it('refreshes entities successfully', async () => {
    const mockEntities = generateMockEntities(10, {
      source: 'ExampleFragmentProvider',
      tier: 'frontend',
      team: 'team-a',
    });

    await provider.start();
    const refreshFn = mockTaskRunner.run.mock.calls[0][0].fn;
    await refreshFn();

    expect(entityAggregatorService.updateOrCreateEntityFragments).toHaveBeenCalledWith(
      'ExampleFragmentProvider',
      expect.any(Array),
      50,
      expect.any(Date)
    );

    expect(loggerService.info).toHaveBeenCalledWith(
      'Successfully refreshed 10 entity fragments'
    );
  });

  it('handles refresh errors gracefully', async () => {
    const error = new Error('Refresh failed');
    entityAggregatorService.updateOrCreateEntityFragments.mockRejectedValue(error);

    await provider.start();
    const refreshFn = mockTaskRunner.run.mock.calls[0][0].fn;
    await refreshFn();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Failed to refresh entity fragments',
      error
    );
  });

  it('sets correct expiration time for entities', async () => {
    const beforeRefresh = new Date();
    
    await provider.start();
    const refreshFn = mockTaskRunner.run.mock.calls[0][0].fn;
    await refreshFn();
    
    const afterRefresh = new Date();

    const callArgs = entityAggregatorService.updateOrCreateEntityFragments.mock.calls[0];
    const expirationTime = callArgs[3] as Date;

    // Expiration should be roughly 1 minute after refresh
    expect(expirationTime.getTime()).toBeGreaterThan(beforeRefresh.getTime() + 59000);
    expect(expirationTime.getTime()).toBeLessThan(afterRefresh.getTime() + 61000);
  });
});