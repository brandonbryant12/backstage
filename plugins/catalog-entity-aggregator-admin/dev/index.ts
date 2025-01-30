import { createDevApp } from '@backstage/dev-utils';
import {
  catalogEntityAggregatorAdminPlugin,
  catalogEntityAggregatorAdminApiRef,
} from '../src';
import { mockCatalogEntityAggregatorAdminApi } from '../src/api/MockCatalogEntityAggregatorAdminApi';

createDevApp()
  .registerPlugin(catalogEntityAggregatorAdminPlugin)
  .registerApi({
    api: catalogEntityAggregatorAdminApiRef,
    deps: {},
    factory: () => mockCatalogEntityAggregatorAdminApi,
  })
  .addPage({
    element: <CatalogEntityAggregatorAdminIndexPage />,
    title: 'Catalog Entity Aggregator Admin (Dev)',
  })
  .render();