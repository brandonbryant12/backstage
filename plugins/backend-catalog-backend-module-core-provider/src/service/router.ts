import { Router } from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { CoreProvider } from '../provider/CoreProvider';
import { InputError } from '@backstage/errors';

export interface RouterOptions {
  logger: LoggerService;
  provider: CoreProvider;
}

export async function createRouter(
  options: RouterOptions,
): Promise<Router> {
  const { logger, provider } = options;

  const router = Router();

  router.post('/entities/:entityRef', async (req, res) => {
    const { entityRef } = req.params;
    const entityUpdate = req.body;

    try {
      if (!entityRef || !entityUpdate) {
        throw new InputError('Missing entity reference or update data');
      }

      logger.info(`Received update request for entity ${entityRef}`);
      const updatedEntity = await provider.updateEntity(entityUpdate);
      
      res.json(updatedEntity);
    } catch (error) {
      logger.error(`Error updating entity ${entityRef}: ${error}`);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
} 