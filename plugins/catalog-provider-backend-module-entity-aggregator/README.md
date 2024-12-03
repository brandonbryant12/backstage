# Entity Aggregator Module for Backstage Catalog

This backend module provides a sophisticated system for aggregating entity data from multiple sources into the Backstage catalog, with intelligent conflict resolution and efficient processing.

## Key Features

- **Multi-Source Entity Management**: Aggregate entities from multiple data sources with priority-based conflict resolution
- **Smart Conflict Resolution**: Merge entity data based on source priorities and field-level precedence
- **Efficient Processing**: 
  - Content-based change detection using SHA-256 hashing
  - Batched database operations
  - Delta-based catalog updates
- **Flexible Scheduling**: Configure per-source refresh schedules
- **Database Support**: Works with both PostgreSQL and SQLite

## Understanding Data Sources

A data source is any system that provides entity data to Backstage. Each data source:

1. **Implements the DataSource abstract class**:
```typescript
abstract class DataSource {
  abstract fetchEntities(): Promise<Entity[]>;
  // ... other methods
}
```

2. **Has required configuration**:
```typescript
interface DataSourceConfig {
  name: string;          // Unique identifier
  priority: number;      // Higher number = higher priority
  refreshSchedule?: string; // Optional cron schedule
}
```

3. **Can be scheduled for updates**:
- Uses cron expressions for scheduling (e.g., "*/5 * * * *" for every 5 minutes)
- Automatic retry mechanisms for failed fetches
- Configurable timeout settings

## Entity Processing Pipeline

1. **Fetch Phase**:
   - Data sources fetch entities either on schedule or on-demand
   - Each entity is validated and transformed into a standardized format

2. **Storage Phase**:
   - Entities are stored with metadata in the database
   - Content hashing detects changes
   - Efficient batch processing (default 1000 entities per batch)

3. **Merge Phase**:
   - Entities from different sources are merged based on priority
   - Annotation merging follows priority rules
   - Higher priority sources override lower priority data

4. **Emission Phase**:
   - Changed entities are emitted to the catalog
   - Delta updates minimize processing overhead
   - Batched emissions for performance

## Usage Example

1. Create your data source:

```typescript
import { DataSource, DataSourceConfig } from '@backstage/plugin-catalog-provider-backend-module-entity-aggregator';

export class MyDataSource extends DataSource {
  async fetchEntities(): Promise<Entity[]> {
    // Your implementation to fetch entities
    return [{
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'example',
        annotations: {
          'my-source/key': 'value'
        },
      },
      spec: {
        type: 'service',
        owner: 'team-a'
      },
    }];
  }
}
```

2. Configure the module:

```typescript
// In packages/backend/src/plugins/catalog.ts
import { entityAggregatorModule } from '@backstage/plugin-catalog-provider-backend-module-entity-aggregator';

export default async function createPlugin(env: PluginEnvironment): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  builder.addModule(entityAggregatorModule);
  // ...
}
```

## Configuration

The module supports configuration through `app-config.yaml`:

```yaml
catalog:
  providers:
    entityAggregator:
      # Number of entities to process in each batch
      batchSize: 1000
      # Update loop interval in milliseconds
      updateInterval: 10000
      dataSources:
        - name: primary-source
          priority: 100
          refreshSchedule: "*/5 * * * *"
        - name: secondary-source
          priority: 50
          refreshSchedule: "*/30 * * * *"
```

## Database Schema

The module maintains its state in a database table with the following structure:

```sql
CREATE TABLE entityRecords (
  id TEXT PRIMARY KEY,
  dataSource TEXT NOT NULL,
  entityRef TEXT NOT NULL,
  metadata JSONB NOT NULL,
  spec JSONB NOT NULL,
  priorityScore INTEGER NOT NULL,
  contentHash TEXT NOT NULL,
  needsEmit BOOLEAN NOT NULL,
  lastTouched TIMESTAMP NOT NULL,
  expirationDate TIMESTAMP,
  UNIQUE(dataSource, entityRef)
);
```

## Error Handling

The module implements comprehensive error handling:
- Failed data source refreshes are logged and retried
- Database operations are transaction-safe
- Entity validation before processing
- Detailed logging for debugging


## Improvements to be made 
- Refactor so Datasources pull method can add entities by chunk