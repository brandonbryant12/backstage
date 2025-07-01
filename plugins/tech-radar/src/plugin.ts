import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { techRadarApiRef as communityTechRadarApiRef } from '@backstage-community/plugin-tech-radar';
import { mockApiClient } from './api/mockClient';
import { createRoutableExtension } from '@backstage/core-plugin-api';
import { entityTechRadarDeepDiveRouteRef } from './routes';

export const techRadarPlugin = createPlugin({
  id: 'tech-radar',
  routes: {
    root: rootRouteRef,
    // deep-dive route will be auto-bound by the app, no extra key needed here
  },
  apis: [
    createApiFactory({
      api: communityTechRadarApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef
      },
      factory: () => mockApiClient,
    }),
  ],
});

export const EntityTechRadarDeepDivePage = techRadarPlugin.provide(
  createRoutableExtension({
    name: 'EntityTechRadarDeepDivePage',
    mountPoint: entityTechRadarDeepDiveRouteRef,
    component: () =>
      import('./components/EntityTechRadarDeepDivePage').then(
        m => m.EntityTechRadarDeepDivePage,
      ),
  }),
);

export { TechRadarPage } from './components/techRadarPage';