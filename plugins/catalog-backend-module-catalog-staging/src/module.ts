import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { entityStagingServiceRef } from './service/EntityStagingServiceRef';

export const catalogModuleCatalogStaging = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'catalog-staging',
  register(reg) {
    // Register the service ref
    reg.registerService(entityStagingServiceRef);

    // Enhanced init block
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        stagingService: entityStagingServiceRef,
      },
      async init({ logger, scheduler, stagingService }) {
        logger.info('Hello from catalog-backend-module-catalog-staging! Staging service loaded.');

        // Schedule purge of expired rows every 5 minutes
        const runner = scheduler.createScheduledTaskRunner({
          frequency: { minutes: 5 },
          timeout: { minutes: 1 },
        });
        await runner.run({
          id: 'catalog-staging-purge-expired',
          fn: async () => {
            const removedCount = await stagingService.purgeExpiredRecords();
            if (removedCount > 0) {
              logger.info(`Purged ${removedCount} expired staging records`);
            }
          },
        });
      },
    });
  },
});