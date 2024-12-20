import { startTestBackend, mockServices } from '@backstage/backend-test-utils';
import { catalogModuleProvider } from './module';

describe('catalogModuleProvider', () => {
  it('logs disabled when provider is disabled', async () => {
    const logger = mockServices.logger.mock();
    const config = mockServices.rootConfig.factory({
      data: {
        entityAggregator: {
          provider: {
            enabled: false,
          },
        },
      },
    });

    await startTestBackend({
      features: [
        catalogModuleProvider,
        config,
        logger,
      ],
    });

    expect(logger.info).toHaveBeenCalledWith("Entity Aggregator Provider Disabled");
  });

  it('adds entity provider when enabled', async () => {
    const logger = mockServices.logger.mock();
    const config = mockServices.rootConfig.factory({
      data: {
        entityAggregator: {
          provider: {
            enabled: true,
          },
        },
      },
    });

    await startTestBackend({
      features: [
        catalogModuleProvider,
        config,
        logger,
      ],
    });

    expect(logger.info).toHaveBeenCalledWith("Registered entity aggregator provider");
  });
});