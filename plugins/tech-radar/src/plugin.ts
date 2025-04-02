import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { techRadarApiRef as communityTechRadarApiRef } from '@backstage-community/plugin-tech-radar';
import { mockApiClient } from './api/mockClient';

export const techRadarPlugin = createPlugin({
  id: 'tech-radar',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: communityTechRadarApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef
      },
      factory: () => {
        return mockApiClient;
      }
    }),
  ]
});
