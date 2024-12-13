import { InputError, NotFoundError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';
import { LoggerService } from '@backstage/backend-plugin-api';
import { AbstractJiraAPIService, createTicketSchema } from './service/types';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { Config } from '@backstage/config';

export interface RouterOptions {
  logger: LoggerService;
  jiraService: AbstractJiraAPIService;
  config: Config;
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { logger, jiraService, config } = options;
  const router = Router();

  router.use(express.json());

  router.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  router.post('/tickets', async (req, res) => {
    const result = createTicketSchema.safeParse(req.body);
    if (!result.success) {
      throw new InputError(
        'Invalid request body',
        { cause: result.error.errors }
      );
    }

    try {
      const ticket = await jiraService.createJiraTicket(result.data);
      res.status(201).json(ticket);
    } catch (error) {
      logger.error('Failed to create Jira ticket', error);
      if (error instanceof z.ZodError) {
        throw new InputError(
          'Invalid request body',
          { cause: error.errors }
        );
      }
      throw error;
    }
  });

  router.get('/tickets/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    const details = await jiraService.getTicketDetails(ticketId);
    
    if (!details) {
      throw new NotFoundError(`Ticket ${ticketId} not found`);
    }
    
    res.json(details);
  });

  router.post('/issues', async (req, res) => {
    const { projectKey, component, label, statusesNames } = req.body;

    if (!projectKey) {
      throw new InputError('Project key is required');
    }

    const issues = await jiraService.getIssues(
      projectKey,
      component,
      label,
      statusesNames,
    );
    
    res.json(issues);
  });

  router.use(MiddlewareFactory.create({
    config,
    logger
  }).error());

  return router;
}