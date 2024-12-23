import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { entityAggregatorManagerModule } from './module';

describe('entityAggregatorManagerModule', () => {
  it('should register the extension point', async () => {
    const extensionPoint = { addEntityProvider: jest.fn() };
    
    // Create our mock logger using mockServices
    const logger = mockServices.logger.mock();

    // Use the default logger factory but override its return value
    const loggerFactory = mockServices.logger.factory();
    loggerFactory.factory = () => logger;

    await startTestBackend({
      extensionPoints: [{ catalogProcessingExtensionPoint, extensionPoint }],
      features: [
        entityAggregatorManagerModule,
        mockServices.rootConfig.factory({
          data: {
            entityAggregator: {
              manager: {
                enabled: true
              }
            }
          }
        }),
        loggerFactory
      ],
    });
    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});