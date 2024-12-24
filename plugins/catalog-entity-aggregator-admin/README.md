# Entity Aggregation Admin View

A Backstage plugin providing an admin interface for entity aggregation.
- [Entity Aggregation Provider](../catalog-backend-aggregator-entity-provider/README.md)
- Entity Aggregation Admin View (this module)
- [Entity Aggregation Manager](../catalog-backend-aggregator-entity-manager/README.md)

## Install

1. Add to `packages/app/package.json`:
```json
{
  "dependencies": {
    "backstage-plugin-catalog-entity-aggregator-admin": "^0.1.0"
  }
}
```

2. Add route in `packages/app/src/App.tsx`:
```tsx
import { CatalogEntityAggregatorAdminIndexPage } from 'backstage-plugin-catalog-entity-aggregator-admin';

<Route
  path="/catalog-entity-aggregator-admin"
  element={<CatalogEntityAggregatorAdminIndexPage />}
/>
```

## Features

- View aggregated entities
- Inspect entity merging