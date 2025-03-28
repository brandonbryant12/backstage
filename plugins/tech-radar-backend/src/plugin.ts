
// <ai_context>
// This file defines the main backend plugin using `createBackendPlugin`.
// It initializes dependencies like logger, database, config, urlReader, and scheduler.
// It sets up the TechRadarDataEntryRepository, CsvTechRadarDataService, and TechRadarFactory.
// It schedules a periodic task using the core scheduler service to refresh data.
// Finally, it creates and registers the API router.
// </ai_context>
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { HumanDuration } from '@backstage/types';
import { Config } from '@backstage/config'; // Correct import for Config type
// TODO: Remove dependency on backend-tasks once scheduling fully relies on coreServices.scheduler
import { createLegacyPluginTaskScheduler } from '@backstage/backend-tasks';

import { createRouter } from './router';
import { TechRadarDataEntryRepository } from './database/TechRadarDataEntryRepository';
import { CsvTechRadarDataService } from './services/CsvTechRadarDataService';
import { TechRadarFactory } from './factories/TechRadarFactory';


/**
 * Reads schedule configuration safely from the config.
 */
function getScheduleConfig(config: Config) : { frequency: HumanDuration, timeout: HumanDuration, initialDelay?: HumanDuration } {
   const scheduleConfig = config.getOptionalConfig('myTechRadar.schedule');
   let frequency: HumanDuration = { hours: 24 }; // Default
   let timeout: HumanDuration = { minutes: 10 }; // Default
   let initialDelay: HumanDuration | undefined = { seconds: 30 }; // Default

   if (scheduleConfig) {
      try {
         frequency = HumanDuration.fromConfig(scheduleConfig.getConfig('frequency'));
         timeout = HumanDuration.fromConfig(scheduleConfig.getConfig('timeout'));
         initialDelay = scheduleConfig.has('initialDelay')
            ? HumanDuration.fromConfig(scheduleConfig.getConfig('initialDelay'))
            : initialDelay; // Keep default if not specified
      } catch (e: any) {
         // Log warning but proceed with defaults
         // Use console.warn here as logger might not be available during config parsing itself
         console.warn(`[tech-radar-backend] Invalid schedule configuration in myTechRadar.schedule: ${e.message}. Using defaults.`);
      }
   }
   return { frequency, timeout, initialDelay };
}


/**
 * My Tech Radar Backend Plugin
 *
 * @public
 */
export const techRadarPlugin = createBackendPlugin({
  pluginId: 'my-tech-radar', // Use a unique ID for your plugin
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
        config: coreServices.rootConfig,
        reader: coreServices.urlReader,
        scheduler: coreServices.scheduler,
        httpRouter: coreServices.httpRouter,
        // httpAuth: coreServices.httpAuth, // Uncomment if auth needed
      },
      async init({
        logger,
        database,
        config,
        reader,
        scheduler,
        httpRouter,
      }) {
        logger.info('Initializing My Tech Radar Backend Plugin');

        const repository = new TechRadarDataEntryRepository(
          await database.getClient(), // Get Knex instance for this plugin
          logger.child({ service: 'tech-radar-repository' }),
        );

        // Choose Data Service Implementation (CSV for now)
        // Consider making the data service type configurable later
        const dataService = new CsvTechRadarDataService(
          config,
          logger.child({ service: 'tech-radar-csv-service' }),
          reader,
        );

        const factory = new TechRadarFactory(
          repository,
          logger.child({ service: 'tech-radar-factory' }),
          // Pass custom quadrants/rings here if needed later
        );

        // --- Set up Periodic Refresh Task ---
        const taskScheduler = scheduler.forPlugin('my-tech-radar');
        const { frequency, timeout, initialDelay } = getScheduleConfig(config);

        await taskScheduler.scheduleTask({
          id: 'refresh_tech_radar_data',
          frequency: frequency,
          timeout: timeout,
          initialDelay: initialDelay,
          async fn() {
            logger.info('Starting scheduled Tech Radar data refresh...');
            try {
              const entries = await dataService.read();
              await repository.replaceAllEntries(entries);
              logger.info('Tech Radar data refresh completed successfully.');
            } catch (error: any) {
              logger.error(`Tech Radar data refresh failed: ${error.message}`, {
                error, // Include stack trace if available
              });
              // Consider re-throwing or handling specific errors if needed
            }
          },
        });
        logger.info(`Scheduled Tech Radar data refresh task with frequency: ${JSON.stringify(frequency)}, timeout: ${JSON.stringify(timeout)}, initialDelay: ${initialDelay ? JSON.stringify(initialDelay) : 'none'}`);


        // --- Register Router ---
        httpRouter.use(
          await createRouter({
            logger: logger.child({ service: 'tech-radar-router' }),
            factory,
            // httpAuth, // Pass if router needs auth service
          }),
        );

        // Allow unauthenticated access to health check
        // Base path is added automatically by httpRouter, so just use relative path
        httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' });

        logger.info('My Tech Radar Backend Plugin initialization finished.');
      },
    });
  },
});

// Config type is now imported correctly at the top.
      