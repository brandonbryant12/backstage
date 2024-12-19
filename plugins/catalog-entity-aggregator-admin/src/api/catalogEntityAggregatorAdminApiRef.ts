import { createApiRef } from '@backstage/core-plugin-api';
import { CatalogEntityAggregatorAdminApi } from './CatalogEntityAggregatorAdminApi';

export const catalogEntityAggregatorAdminApiRef = createApiRef<CatalogEntityAggregatorAdminApi>({
  id: 'plugin.catalog-entity-aggregator-admin.service',
}); 