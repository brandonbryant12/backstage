# Entity Aggregation Module

The Entity Aggregation Module is a service developed to aggregate Backstage entities from multiple data sources and store them. These entities will occupy the default namespace and can be merged based on configurable priorities.

This module is composed of 3 Backstage plugins:

- [Entity Aggregation Provider](../catalog-backend-aggregator-entity-provider/README.md): Handles adding entities to the Backstage processing pipeline
- [Entity Aggregation Admin View](../catalog-entity-aggregator-admin/README.md): Provides a debug view of the state table and entity merging
- Entity Aggregation Manager (this module): Core management and orchestration functionality

## Quick Installation

1. Add the dependency to your `packages/backend/package.json`:
```json
{
  "dependencies": {
    "@core/plugin-catalog-backend-module-aggregator-entity-manager": "^0.1.0"
  }
}
```

2. Configure the plugin in your `app-config.yaml`:
```yaml
entityAggregator:
  manager:
    enabled: true
```

3. Import and register the module in your `packages/backend/src/index.ts`:
```typescript
// In your backend initialization:
backend.add(import("@core/plugin-catalog-backend-module-aggregator-entity-manager"));
```

## Core Responsibilities

The Entity Aggregation Manager is responsible for:

- Refreshing data from configured data sources on schedules
- Managing record expiration based on TTL configured per data source
- Tracking entity updates and changes
- Merging records from multiple sources based on priority
- Maintaining the state table for entity records

## Database Schema

The module maintains its state in a database table with the following structure:

```sql
CREATE TABLE unmerged_entity_records (
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

## Implementing a Custom Data Source

Create a new class that implements the `DataSource` interface:

```typescript
import { DataSource, DataSourceConfig } from './DataSource';
import { Entity } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';

export class CustomDataSource extends DataSource {
  constructor(config: DataSourceConfig, logger: LoggerService) {
    super(config, logger);
  }

  async refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void> {
    try {
      // Fetch your entities
      const entities = await this.fetchEntities();
      
      // Provide them to the manager
      await provide(entities);
      
      this.logger.info(`Successfully refreshed ${entities.length} entities`);
    } catch (error) {
      this.logger.error(`Failed to refresh entities`, error);
    }
  }
}
```

Register your data source in your backend module:

```typescript
const dataSource = new CustomDataSource({
  name: 'custom-source',
  priority: 100,
  refreshSchedule: {
    frequency: { minutes: 30 },
    timeout: { minutes: 10 },
  },
  ttlSeconds: 3600, // Optional TTL
}, logger);

entityAggregator.addDataSource(dataSource);
```

## Merging Strategy

The manager uses a priority-based merging strategy where:

1. The highest priority source's data is used as the base
2. Arrays (like tags, annotations, links) are merged from all sources
3. Annotations are merged with higher priority values taking precedence
4. Entity relationships (APIs, dependencies) are combined from all sources

Example merge result:
```yaml
# Result of merging these records:
# 1. DataSource A (priority: 100)
# 2. DataSource B (priority: 50)

apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: service-1
  annotations:
    a.com/high-priority: "from-source-a"
    b.com/low-priority: "from-source-b"
  tags: 
    - typescript
    - react
    - frontend
spec:
  type: service
  lifecycle: production
  owner: team-a
  dependsOn:
    - component:default/auth-service
    - resource:default/database
```

## Extension Points

The module is designed to be easily extensible:

- Custom Data Sources: Create new data sources by implementing the `DataSource` interface
- REST API Integration: The architecture supports adding REST endpoints for push-based updates
- Custom Merging Logic: The merging strategy can be customized for specific needs

## Future Improvements

- REST API endpoints for push-based updates with authentication
- Additional merging strategies and conflict resolution options
- Custom validation rules per data source
- Configurable retry strategies for failed refreshes
- Data source health checks and status reporting

### Testing 
set env variable `export BACKSTAGE_TEST_DATABASE_POSTGRES16_CONNECTION_STRING=postgresql://docker:docker@localhost:5432/docker` for pg tests to run

# Backstage Entity Aggregator

A Backstage backend plugin that allows collecting and merging entity data from multiple sources before ingesting it into the Backstage catalog.

## Overview

The Entity Aggregator plugin provides a flexible way to:
- Collect entity metadata from multiple data sources
- Merge overlapping entity information using priority-based rules
- Efficiently sync the aggregated data with the Backstage catalog
- Handle conflicts and duplicates across different data sources

## Architecture

The following sequence diagram illustrates how the Aggregator Manager and Provider work together with the Backstage catalog. It shows the flow of data from various sources through the aggregation process and into the Backstage catalog.

```mermaid
sequenceDiagram
    participant DS as Data Source(s)<br>(A, B, GitHub, etc.)
    participant M as Aggregator Manager
    participant DB as "Aggregator DB (unmerged_entity_records)"
    participant P as Aggregator Provider
    participant C as Backstage Catalog<br>(Processing Loop + DB)
    
    DS->>M: (on schedule) fetch Entities
    note right of DS: Example: <br/>• GitHub repos<br/>• APIs<br/>• Internal services
    M->>DB: upsert unmerged entity records
    note right of DB: Entities remain <br/>unmerged in a single table
    
    note over M: Merge logic is triggered <br/>when provider requests data
    M-->>M: *Priority-based merging* <br/>(recordMerger.ts)
    
    P->>M: getRecordsToEmit(batchSize)
    M->>DB: read updated (unmerged) records
    M->>M: merge relevant records into final entities
    M->>P: return merged entities
    
    note over P: Provider implements<br/>EntityProvider interface
    P->>C: applyMutation(added, removed) <br/>(type: "delta")
    note right of C: Backstage's catalog <br/>ingestion loop begins:
    C-->>C: parse → validate → process → store
    note right of C: Final processed entities <br/>are stored in the Catalog DB
    
    P->>M: markEmitted(entityRefs)
    M->>DB: sets updated = false <br/>(so these records are not re-emitted)
    
    alt Expired or invalid
      P->>M: purgeExpiredRecords()
      M->>DB: query aggregator records by locationKey
      M->>M: identify invalid or removed refs
      M->>P: pass invalid references to remove
      P->>C: applyMutation(removed = invalid)
      note right of C: Catalog cleans up <br/>orphaned references
    end
    
    note over C: Entities now appear in <br/>Backstage Catalog with full metadata
```

### Key Components

- **Data Sources**: External systems that provide entity data (e.g., GitHub repositories, APIs, internal services)
- **Aggregator Manager**: Handles data collection and implements merging logic
- **Aggregator DB**: Stores unmerged entity records in a single table
- **Aggregator Provider**: Implements Backstage's EntityProvider interface
- **Backstage Catalog**: Processes and stores the final entities
