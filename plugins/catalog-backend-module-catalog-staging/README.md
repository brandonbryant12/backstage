# backstage-plugin-catalog-backend-module-catalog-staging

The catalog-staging backend module for the catalog plugin provides a way to manage and stage entity data before it is processed by the Backstage catalog. It is a refactor of our previous single aggregator provider system, enabling a more flexible architecture for handling multiple data sources and partial (delta) updates.

## Overview

This module introduces a staging layer that helps orchestrate the merging of entity data from multiple data sources and handles incremental updates. It maintains a stateful mechanism allowing each data source to submit changes in a controlled manner.

### Key Use Cases

1. **Merging Entities from Multiple Data Sources**  
   - You can configure multiple data sources, each adding or updating entity records.  
   - The staging module merges these records in a priority-based manner to produce final entities.
   - This approach is particularly useful when different teams or systems own subsets of metadata for the same entity.

2. **Delta Updates**  
   - Instead of re-ingesting all entity data from a data source each time, delta updates allow you to send only the changes.  
   - This reduces overhead on both the data source and the Backstage catalog, as only modified entities are processed.

## Architecture Diagram

Below is a Mermaid diagram illustrating how the staging module interacts with various providers and the Backstage catalog:

```mermaid
flowchart LR
    A((Multiple Data Sources)) -->|1. Submits / Updates Entities| B[Catalog Staging Service]
    B -->|2. Stores / Merges Entities| S((Staging DB))
    B -->|3. Delta Tracking| S
    B -->|4. Finalized Entities| C[Backstage Catalog]

    subgraph Data Sources
      A1[DataSource A] 
      A2[DataSource B] 
      A3[DataSource N] 
    end

    B((catalog-backend-module-catalog-staging))

    C((Catalog DB))

    A1 --> B
    A2 --> B
    A3 --> B
    C -->|5. Catalog Ingestion Process| C