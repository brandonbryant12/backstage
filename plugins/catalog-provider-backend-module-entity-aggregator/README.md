# Entity Aggregator Module for Backstage Catalog

This module provides a flexible entity aggregation system for the Backstage catalog, allowing you to combine entity data from multiple sources with configurable priorities and update schedules.

## Overview

The Entity Aggregator consists of three main components working together to provide a robust entity aggregation pipeline:

### EntityAggregatorProvider

The central orchestrator that:
- Manages scheduling of data source refreshes
- Controls the entity emission pipeline to Backstage
- Handles database cleanup and updates
- Merges entities from multiple sources based on priority

### DatabaseStore

A persistent storage layer that:
- Stores entity records from multiple data sources
- Manages record expiration and TTL
- Tracks entity changes and emission status
- Provides efficient querying and updates

### DataSources

Pluggable data source implementations that:
- Pull entity data from external systems
- Configure refresh schedules and priorities
- Support optional TTL for data freshness
- Can be easily extended for new data sources

## Key Processes

The aggregator manages three main processes:

1. **Data Collection**
   - Scheduled pulls from multiple data sources
   - Configurable refresh intervals per source
   - Support for data expiration (TTL)

2. **Entity Merging & Emission**
   - Merges entities from multiple sources
   - Priority-based conflict resolution
   - Efficient change detection
   - Batched updates to Backstage

3. **Database Maintenance**
   - Automatic cleanup of expired records
   - Tracking of emission status
   - Efficient storage and retrieval

## Extension Points

The module is designed to be easily extensible:

- **Custom Data Sources**: Create new data sources by implementing the `DataSource` interface
- **REST API Integration**: The architecture supports adding REST endpoints for push-based updates
- **Custom Merging Logic**: The merging strategy can be customized for specific needs

## Example Usage

```typescript
import { Entity } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';

export interface DataSourceConfig {
  name: string;
  priority: number;
  refreshSchedule?: SchedulerServiceTaskScheduleDefinition;
  ttlSeconds?: number;
}

export abstract class DataSource {
  protected readonly logger: LoggerService;
  protected readonly config: DataSourceConfig;

  constructor(config: DataSourceConfig, logger: LoggerService) {
    this.config = config;
    this.logger = logger.child({ datasource: config.name });
  }

  getName(): string {
    return this.config.name;
  }

  getPriority(): number {
    return this.config.priority;
  }

  getSchedule(): SchedulerServiceTaskScheduleDefinition | undefined {
    return this.config.refreshSchedule;
  }

  /**
   * Implement this method to fetch entities from your data source.
   * Use the provided callback to send entities to the aggregator.
   * The callback can be called multiple times if you need to send entities in chunks.
   * 
   * @param provide - Callback function to send entities to the aggregator
   */
  abstract refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void>;
}
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

## Future Improvements

- REST API endpoints for push-based updates with Authentication
- Additional merging strategies
- Custom validation rules per data source
- Configurable retry strategies