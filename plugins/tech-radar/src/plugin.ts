import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const techRadarPlugin = createPlugin({
  id: 'tech-radar',
  routes: {
    root: rootRouteRef,
  },
});

export const TechRadarPage = techRadarPlugin.provide(
  createRoutableExtension({
    name: 'TechRadarPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
