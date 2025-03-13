import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef, catalogCardsRouteRef, apiCardsRouteRef } from './routes';

export const helloworldPlugin = createPlugin({
  id: 'helloworld',
  routes: {
    root: rootRouteRef,
    catalogCards: catalogCardsRouteRef,
    apiCards: apiCardsRouteRef,
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

export const CatalogCardsPage = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'CatalogCardsPage',
    component: () =>
      import('./components/CatalogCardsPage').then(m => m.CatalogCardsPage),
    mountPoint: catalogCardsRouteRef,
  }),
);

export const ApiCardsPage = helloworldPlugin.provide(
  createRoutableExtension({
    name: 'ApiCardsPage',
    component: () =>
      import('./components/ApiCardsPage').then(m => m.ApiCardsPage),
    mountPoint: apiCardsRouteRef,
  }),
);
