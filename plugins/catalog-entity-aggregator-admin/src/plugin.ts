import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef, rawEntitiesRouteRef } from './routes';

export const catalogEntityAggregatorAdminPlugin = createPlugin({
  id: 'catalog-entity-aggregator-admin',
  routes: {
    root: rootRouteRef,
    raw: rawEntitiesRouteRef,
  },
});

export const CatalogEntityAggregatorAdminPage = catalogEntityAggregatorAdminPlugin.provide(
  createRoutableExtension({
    name: 'CatalogEntityAggregatorAdminPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);

// Add a routable extension for raw entities page that we can link from entity pages
export const CatalogEntityAggregatorAdminRawPage = catalogEntityAggregatorAdminPlugin.provide(
  createRoutableExtension({
    name: 'CatalogEntityAggregatorAdminRawPage',
    component: () =>
      import('./components/RawEntitiesPage/RawEntitiesPage').then(m => m.RawEntitiesPage),
    mountPoint: rawEntitiesRouteRef,
  }),
);