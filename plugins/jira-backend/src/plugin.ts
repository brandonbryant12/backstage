import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { jiraServiceRef } from './service/JiraService';

export const jiraPlugin = createBackendPlugin({
  pluginId: 'jira',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        jiraService: jiraServiceRef,
      },
      async init({ logger, config, httpRouter, jiraService}) {
        const router = await createRouter({
          logger,
          jiraService,
          config,
        });

        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated'
        })
      },
    });
  },
});