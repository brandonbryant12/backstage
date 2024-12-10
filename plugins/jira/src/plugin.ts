import {
  createPlugin,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import { jiraApiRef } from './api/JiraApi';
import { JiraClient } from './api/JiraClient';

export const jiraPlugin = createPlugin({
  id: 'jira',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: jiraApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new JiraClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export { jiraApiRef } from './api/JiraApi';
export type { JiraApi } from './api/JiraApi';

