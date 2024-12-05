import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const sandboxPlugin = createPlugin({
  id: 'sandbox',
  routes: {
    root: rootRouteRef,
  },
});

export const SandboxPage = sandboxPlugin.provide(
  createRoutableExtension({
    name: 'SandboxPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
