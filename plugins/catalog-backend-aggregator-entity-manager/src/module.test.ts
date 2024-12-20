import { startTestBackend, mockServices } from '@backstage/backend-test-utils';
import { entityAggregatorModule } from './module';

describe('entityAggregatorModule', () => {
  it('logs disabled when manager is disabled', async () => {
    const logger = mockServices.logger.mock();
    const config = mockServices.rootConfig.factory({
      data: {
        entityAggregator: {
          manager: {
            enabled: false,
          },
        },
      },
    });

    await startTestBackend({
      features: [
        entityAggregatorModule,
        config,
        logger,
      ],
    });

    expect(logger.info).toHaveBeenCalledWith("Entity Aggregator Manager Disabled");
  });

  it('starts aggregator and attaches router when enabled', async () => {
    const logger = mockServices.logger.mock();
    const config = mockServices.rootConfig.factory({
      data: {
        entityAggregator: {
          manager: {
            enabled: true,
          },
        },
      },
    });

    await startTestBackend({
      features: [
        entityAggregatorModule,
        config,
        logger,
      ],
    });

    expect(logger.info).toHaveBeenCalledWith("Entity aggregator started");
  });
});