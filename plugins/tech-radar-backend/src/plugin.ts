import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { TechRadarCSVDataService } from './services/techRadarCSVDataService';
import { EntriesRepository } from './repository/entriesRepository';
/**
 * techRadarPlugin backend plugin
 *
 * @public
 */
export const techRadarPlugin = createBackendPlugin({
  pluginId: 'tech-radar',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
        
      },
      async init({ logger, httpAuth, httpRouter, scheduler, database}) {
        const entriesRepository = await EntriesRepository.create(database);
        const csvPath = '';
        const techRadarService = new TechRadarCSVDataService(csvPath, {
          logger,
          repository: entriesRepository,
          scheduler,
        });

        techRadarService.scheduleUpdateTask();

        httpRouter.use(
          await createRouter({
            httpAuth,
            entriesRepository,
            logger,
          }),
        );
        httpRouter.addAuthPolicy({
           path: '/health',
           allow: 'unauthenticated',
        });
      },
    });
  },
});
      