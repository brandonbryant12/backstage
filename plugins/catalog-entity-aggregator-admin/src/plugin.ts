import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { catalogEntityAggregatorAdminApiRef } from './api/catalogEntityAggregatorAdminApiRef';
import { CatalogEntityAggregatorAdminClient } from './api/CatalogEntityAggregatorAdminClient';

export const catalogEntityAggregatorAdminPlugin = createPlugin({
  id: 'catalog-entity-aggregator-admin',
  apis: [
    createApiFactory({
      api: catalogEntityAggregatorAdminApiRef,
      deps: { 
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) => 
        new CatalogEntityAggregatorAdminClient({ discoveryApi, fetchApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const CatalogEntityAggregatorAdminPage = catalogEntityAggregatorAdminPlugin.provide(
  createRoutableExtension({
    name: 'CatalogEntityAggregatorAdminPage',
    component: () =>
      import('./components/RawEntitiesPage').then(m => m.RawEntitiesPage),
    mountPoint: rootRouteRef,
  }),
);