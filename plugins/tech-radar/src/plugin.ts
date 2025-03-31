import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { TechRadarClient } from './api/TechRadarClient';
import { techRadarApiRef as communityTechRadarApiRef } from '@backstage-community/plugin-tech-radar';

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
      factory: ({ discoveryApi, fetchApi }) => {
        return new TechRadarClient({ discoveryApi, fetchApi });
      }
    }),
  ]
});
