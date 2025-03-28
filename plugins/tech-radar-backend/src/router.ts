
// <ai_context>
// This file defines the Express router for the tech radar backend plugin.
// It sets up endpoints like '/health' and '/data'. The '/data' endpoint
// uses the injected TechRadarFactory to build and return the radar data.
// It also includes standard error handling using @backstage/backend-common.
// Authentication hooks are commented out but can be added if needed.
// </ai_context>
import { LoggerService } from '@backstage/backend-plugin-api';
// import { HttpAuthService } from '@backstage/backend-plugin-api'; // Uncomment if auth needed
// import { RootConfigService } from '@backstage/backend-plugin-api'; // Uncomment if config needed
import express from 'express';
import Router from 'express-promise-router';
import { errorHandler } from '@backstage/backend-common';
import { TechRadarFactory } from './factories/TechRadarFactory';
// import { InputError } from '@backstage/errors'; // Uncomment if input validation needed
// import { z } from 'zod'; // Uncomment if input validation needed

export interface RouterOptions {
  logger: LoggerService;
  factory: TechRadarFactory;
  // httpAuth?: HttpAuthService; // Uncomment if auth needed
  // config?: RootConfigService; // Uncomment if config needed directly in router
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, factory } = options;
  // const { httpAuth } = options; // Uncomment if auth needed

  const router = Router();
  router.use(express.json());

  logger.info('Initializing tech-radar backend router...');

  // Define public health check endpoint
  router.get('/health', (_, response) => {
    logger.info('PONG! Health check successful.');
    response.status(200).json({ status: 'ok' });
  });

  // Define data endpoint
  // Authentication can be added here using httpAuth if needed
  router.get('/data', async (req, response) => {
    /* Example Authentication:
    const credentials = await httpAuth?.credentials(req, { allow: ['user'] });
    if (!credentials) {
       throw new NotAllowedError('Unauthorized');
    }
    logger.info(`User ${credentials.principal.userEntityRef} accessed tech radar data`);
    */

    // const radarId = req.query.radarId as string | undefined; // For multi-radar support later
    logger.debug(`Request received for tech radar data`); // Use debug for less noise

    // No try/catch needed here, express-promise-router handles async errors
    const radarData = await factory.buildRadarResponse(/* radarId */);
    response.json(radarData);
  });

  // Centralized error handling middleware from @backstage/backend-common
  // This should be the last middleware added to the router
  router.use(errorHandler());

  logger.info('Tech-radar backend router initialized.');
  return router;
}
      