import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'catalog-entity-aggregator-admin',
});

// Add a new routeRef for the raw entities page
export const rawEntitiesRouteRef = createRouteRef({
  id: 'catalog-entity-aggregator-admin-raw-entities',
});