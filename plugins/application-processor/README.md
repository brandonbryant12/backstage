# Application Processor Module

## Multi-Provider Entity Analysis Report

### Executive Summary
An investigation was conducted to determine if multiple providers can contribute information about the same entity in Backstage. Despite implementing a custom processor for merging, we discovered fundamental limitations in Backstage's entity ownership model.

### Experiment Setup

#### Test Providers Configuration

We created two test providers that emit the same entity with different annotations:

Provider A:
```json
{
  "metadata": {
    "annotations": {
      "ProviderA": "!!!!!!!",
      "backstage.io/managed-by-location": "url:http://example.com/test-entity"
    }
  }
}
```

Provider B:
```json
{
  "metadata": {
    "annotations": {
      "ProviderB": "YOYOYO",
      "backstage.io/managed-by-location": "url:http://example.com/test-entity"
    }
  }
}
```

Timing Configuration:
- Provider A: Runs every 5 minutes
- Provider B: 
  - Runs every 30 seconds
  - Initial 1-minute delay

### Observed Behavior

#### 1. Provider Conflict
```log
[backend]: catalog warn Source test-provider-provider-b detected conflicting entityRef component:default/test-entity already referenced by test-provider-provider-a:test-entity and now also test-provider-provider-b:test-entity
```

#### 2. Final Entity State
```json
{
  "metadata": {
    "annotations": {
      "ProviderA": "!!!!!!!",
      "test-provider-provider-a/managed": "true",
      "provider-a/source": "system-a",
      "provider-a/version": "1.0.0"
    }
  }
}
```

Note: Provider B's annotations are not present in the final entity.

### Implementation Attempts

#### 1. ComponentMergeProcessor
We implemented a processor to merge entities:
```typescript
class ComponentMergeProcessor implements CatalogProcessor {
  async preProcessEntity(entity: Entity): Promise<Entity> {
    // Remove managed fields (relations, status)
    const sanitizedEntity = this.sanitizeEntity(entity);
    
    // Attempt to merge with existing entity
    const existingEntity = await this.catalogClient.getEntityByRef(entityRef);
    if (existingEntity) {
      return this.mergeEntities(existingEntity, sanitizedEntity);
    }
  }
}
```

#### 2. Field Sanitization
We discovered certain fields must be excluded from processing:
- `relations`: Added later in the pipeline
- `status`: Managed by Backstage
- Other Backstage-managed metadata

### Key Findings

1. **Entity Ownership**:
   - Backstage enforces strict single-provider ownership
   - Subsequent provider updates are treated as conflicts
   - Ownership is determined by first successful registration

2. **Processing Pipeline**:
   - Certain fields (relations, status) are managed by Backstage
   - Custom processors cannot override core Backstage behaviors
   - Entity merging at processor level doesn't affect provider ownership

3. **Update Behavior**:
   - Only the owning provider can update an entity
   - Other providers' updates are logged as conflicts
   - Annotations and metadata from secondary providers are discarded

### Discussion: State Machine Limitations

The experiment revealed a fundamental limitation in achieving a true state machine for entities within Backstage's current architecture. Here's why:

1. **Current Architecture Limitations**:
   - Backstage's entity ownership model is exclusive
   - The catalog maintains strict provider-to-entity relationships
   - No built-in support for multi-provider state management

2. **State Machine Requirements**:
   - Multiple providers should be able to contribute state
   - State transitions should be predictable and atomic
   - State history should be maintained
   - Conflicts should be resolvable

3. **Alternative Approach Required**:
   - State management must be implemented at the provider level
   - External data sources should maintain their own state
   - Providers should resolve conflicts before emitting to Backstage
   - Consider implementing a state machine outside of Backstage

4. **Recommendations**:
   The ideal solution would involve:
   - Implementing state management in the external system
   - Having a single authoritative provider per entity
   - Using the provider to aggregate state from multiple sources
   - Emitting only the final, resolved state to Backstage

### Test Implementation
Located in:
- `src/processors/ComponentMergeProcessor.ts`
- `src/providers/TestProvider.ts`
- `src/module.ts`

To run:
```bash
yarn dev
```
