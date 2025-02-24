import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const helloworldPlugin = createPlugin({
  id: 'helloworld',
  routes: {
    root: rootRouteRef,
  },
});

export const HelloworldPage = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'HelloworldPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
