import { HttpAuthService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { EntriesRepository } from './repository/entriesRepository';
import { TechRadarService } from './services/TechRadarService';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface RouterOptions {
  httpAuth: HttpAuthService;
  entriesRepository: EntriesRepository;
  logger: LoggerService;
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const techRadarService = new TechRadarService({
    logger: options.logger,
    repository: options.entriesRepository,
  });

  router.get('/data', async (_req, res) => {
    try {
      const entries = await techRadarService.getData();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
  });

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router as unknown as express.Router;
}
      