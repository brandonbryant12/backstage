import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  allEntitiesRouteRef,
} from './routes';
import {
  CatalogEntityAggregatorAdminClient,
  catalogEntityAggregatorAdminApiRef,
} from './api/CatalogEntityAggregatorAdminApi';

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
    root: allEntitiesRouteRef,
  },
});

export const CatalogEntityAggregatorAdminIndexPage = catalogEntityAggregatorAdminPlugin.provide(
  createRoutableExtension({
    name: 'CatalogEntityAggregatorAdminIndexPage',
    component: () =>
      import('./components/EntityAggregatorAdminPage').then(m => m.EntityAggregatorAdminPage),
    mountPoint: allEntitiesRouteRef,
  }),
);