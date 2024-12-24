# Entity Aggregation Module

The Entity Aggregation Module is a service developed to aggregate Backstage entities from multiple data sources and store them. This module is composed of 3 Backstage plugins:

- Entity Aggregation Provider (this module): Handles the integration with Backstage's catalog processing pipeline
- [Entity Aggregation Admin View](../catalog-entity-aggregator-admin/README.md): UI for debugging and monitoring entity merging
- [Entity Aggregation Manager](../catalog-backend-aggregator-entity-manager/README.md): Core entity management functionality

## Provider Overview

The Entity Aggregation Provider is responsible for adding aggregated entities to the Backstage processing pipeline. It is intentionally decoupled from the Entity Aggregation Manager to allow for future flexibility - the manager could potentially be replaced by an external system while maintaining the same provider interface.

## Quick Installation

1. Add the dependency to your `packages/backend/package.json`:
```json
{
  "dependencies": {
    "@core/plugin-catalog-backend-module-aggregator-entity-provider": "^0.1.0"
  }
}
```

2. Configure the plugin in your `app-config.yaml`:
```yaml
entityAggregator:
  provider:
    enabled: true
```

3. Import and register the module in your `packages/backend/src/index.ts`:
```typescript
// In your backend initialization:
backend.add(import("@core/plugin-catalog-backend-module-aggregator-entity-provider"));
```

## Architecture

The provider maintains its own schedule for emitting entities to the catalog, independent of the manager's refresh schedules.

### Entity Processing Pipeline

1. **Batched Entity Retrieval**
   - Provider requests entities from manager in configurable batch sizes
   - Only changed entities are included in batches
   - Batching helps manage memory usage and processing load

2. **Entity Preparation**
   - Entities are annotated with their origin:
     ```yaml
     metadata:
       annotations:
         'backstage.io/managed-by-origin-location': 'entityAggregator://entity-name'
         'backstage.io/managed-by-location': 'entityAggregator://entity-name'
     ```
   - Entity references are properly formatted
   - Kind fields are capitalized according to Backstage conventions

3. **Delta Updates**
   - Provider tracks which entities have been emitted
   - Only changed entities are processed in each cycle
   - Reduces unnecessary catalog operations


### Configuration Options

The provider supports several configuration options in `app-config.yaml`:

## Integration with Backstage

The provider integrates with Backstage's catalog processing pipeline through the `EntityProvider` interface:

```typescript
class EntityAggregatorProvider implements EntityProvider {
  private connection?: EntityProviderConnection;

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    // Set up refresh schedule
  }

  async refresh(options?: RefreshOptions): Promise<void> {
    // Emit updated entities to the catalog
  }
}
```

### Location Keys

The provider uses consistent location keys to help Backstage track entity origins:

```typescript
const locationKey = `entity-aggregator-provider:${entityRef}`;
```

This ensures proper entity lifecycle management within the Backstage catalog.

## Monitoring and Debugging

The provider emits detailed logs to help with monitoring and debugging:

- Entity emission statistics
- Processing times
- Batch sizes and counts
- Error details
- Connection status
- Schedule information

Example log output:
```
info Emitting 150 merged entities (from 200 total records)
debug Successfully marked 150 entities as emitted
info Retrieved 200 merged entity records to process
debug No mutations to emit after processing
```