import { 
  EntityProvider, 
  EntityProviderConnection 
} from '@backstage/plugin-catalog-node';
import { 
  LoggerService, 
  SchedulerServiceTaskRunner,
  CacheService 
} from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { sourceAEntities } from '../datasources/sourceA/entityDataA';
import { sourceBEntities } from '../datasources/sourceB/entityDataB';

const SOURCE_OF_TRUTH_CACHE_KEY = 'DataSourceACachedEntities';
const SOURCE_OF_TRUTH_CACHE_TTL = 30; // 30 seconds

type EnrichmentSource = {
  name: string;
  getEntities: () => Promise<any[]>;
};

export class CoreProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private readonly cache: CacheService;
  private readonly enrichmentSources: EnrichmentSource[];

  constructor(
    logger: LoggerService,
    schedule: SchedulerServiceTaskRunner,
    cache: CacheService,
  ) {
    this.logger = logger;
    this.cache = cache;
    this.enrichmentSources = this.setupEnrichmentSources();
    this.scheduleFn = this.createScheduleFn(schedule);
  }

  private setupEnrichmentSources(): EnrichmentSource[] {
    return [
      {
        name: 'Source B',
        getEntities: async () => {
          try {
            return sourceBEntities.entities;
          } catch (error) {
            this.logger.error(`Error fetching from Source B: ${error}`);
            return [];
          }
        }
      }
      // Additional sources can be added here
    ];
  }

  getProviderName(): string {
    return 'core-provider';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    this.logger.info('Connecting CoreProvider');
    await this.scheduleFn();
  }

  private createScheduleFn(
    schedule: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return schedule.run({
        id: taskId,
        fn: async () => {
          try {
            await this.refresh();
          } catch (error) {
            this.logger.error(`Failed to refresh: ${error}`);
          }
        }
      });
    };
  }

  private async getSourceOfTruthEntities() {
    try {
      // Try to get entities from cache
      const cachedEntities = await this.cache.get(SOURCE_OF_TRUTH_CACHE_KEY);
      if (cachedEntities) {
        this.logger.info('Retrieved source of truth entities from cache');
        return cachedEntities;
      }

      // If not in cache, get from source
      this.logger.info('Fetching source of truth entities');
      const entities = sourceAEntities.entities;
      
      // Store in cache
      await this.cache.set(SOURCE_OF_TRUTH_CACHE_KEY, entities, { ttl: SOURCE_OF_TRUTH_CACHE_TTL });
      this.logger.info('Cached source of truth entities');
      
      return entities;
    } catch (error) {
      this.logger.error(`Error fetching source of truth entities: ${error}`);
      return [];
    }
  }

  private mergeFields(sourceA: any, sourceB: any): any {
    if (!sourceB) return sourceA;
    if (!sourceA) return sourceB;

    const result = { ...sourceA };

    Object.entries(sourceB).forEach(([key, valueB]) => {
      if (Array.isArray(valueB)) {
        // For arrays, combine and remove duplicates
        const existingArray = Array.isArray(result[key]) ? result[key] : [];
        result[key] = [...new Set([...existingArray, ...valueB])];
      } else if (typeof valueB === 'object' && valueB !== null) {
        // Recursively merge objects
        result[key] = this.mergeFields(result[key] || {}, valueB);
      } else if (!(key in result)) {
        // Only add non-array, non-object values if they don't exist in source A
        result[key] = valueB;
      }
    });

    return result;
  }

  private getEntityCacheKey(entity: any): string {
    return `entity-${stringifyEntityRef({
      kind: entity.kind,
      namespace: entity.metadata.namespace || 'default',
      name: entity.metadata.name,
    })}`;
  }

  private async getCachedEntity(entityRef: string): Promise<any | undefined> {
    try {
      return await this.cache.get(`entity-${entityRef}`);
    } catch (error) {
      this.logger.error(`Error fetching cached entity ${entityRef}: ${error}`);
      return undefined;
    }
  }

  private async setCachedEntity(entity: any): Promise<void> {
    const key = this.getEntityCacheKey(entity);
    try {
      await this.cache.set(key, entity);
      this.logger.info(`Cached entity ${key}`);
    } catch (error) {
      this.logger.error(`Error caching entity ${key}: ${error}`);
    }
  }

  async updateEntity(entityToUpdate: any): Promise<any> {
    const key = this.getEntityCacheKey(entityToUpdate);
    this.logger.info(`Processing update for entity ${key}`);

    // Get the current merged entity from cache
    const existingEntity = await this.getCachedEntity(key);
    if (!existingEntity) {
      throw new Error(`Entity ${key} not found in cache`);
    }

    // Merge the update with the existing entity
    const mergedEntity = this.mergeFields(existingEntity, entityToUpdate);

    // Cache the new merged entity
    await this.setCachedEntity(mergedEntity);

    // If we have a connection, apply the mutation
    if (this.connection) {
      await this.connection.applyMutation({
        type: 'delta',
        added: [{
          entity: mergedEntity,
          locationKey: `core-provider-${mergedEntity.metadata.name}`,
        }],
        removed: [],
      });
    }

    return mergedEntity;
  }

  private async enrichEntities(baseEntities: any[]): Promise<any[]> {
    const enrichedEntities = new Map<string, any>();
    
    // Initialize with base entities
    for (const entity of baseEntities) {
      const key = `${entity.kind}:${entity.metadata.namespace || 'default'}:${entity.metadata.name}`;
      const enrichedEntity = {
        entity: {
          ...entity,
          metadata: {
            ...entity.metadata,
            annotations: {
              ...entity.metadata.annotations,
              'backstage.io/managed-by-location': `url:core-provider-${entity.metadata.name}`,
              'backstage.io/managed-by-origin-location': `url:core-provider-${entity.metadata.name}`,
            },
          },
        },
        locationKey: `core-provider-${entity.metadata.name}`,
      };
      
      enrichedEntities.set(key, enrichedEntity);
      
      // Cache the base entity
      await this.setCachedEntity(enrichedEntity.entity);
    }

    // Enrich from each source
    for (const source of this.enrichmentSources) {
      this.logger.info(`Enriching entities from ${source.name}`);
      const enrichmentEntities = await source.getEntities();

      for (const enrichEntity of enrichmentEntities) {
        const key = `${enrichEntity.kind}:${enrichEntity.metadata.namespace || 'default'}:${enrichEntity.metadata.name}`;
        
        if (enrichedEntities.has(key)) {
          // Only enrich Component kinds
          if (enrichEntity.kind === 'Component') {
            const existingEntity = enrichedEntities.get(key)!.entity;
            const mergedEntity = this.mergeFields(existingEntity, enrichEntity);
            
            const enrichedEntry = {
              entity: mergedEntity,
              locationKey: `core-provider-${enrichEntity.metadata.name}`,
            };
            
            enrichedEntities.set(key, enrichedEntry);
            
            // Cache the merged entity
            await this.setCachedEntity(mergedEntity);
          }
        }
      }
    }

    return Array.from(enrichedEntities.values());
  }

  async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to catalog');
    }

    this.logger.info('Starting refresh of core provider');

    // Get base entities from source of truth
    const baseEntities = await this.getSourceOfTruthEntities();
    
    // Enrich base entities with data from other sources
    const enrichedEntities = await this.enrichEntities(baseEntities);

    await this.connection.applyMutation({
      type: 'delta',
      added: enrichedEntities,
      removed: [],
    });

    this.logger.info('Completed refresh of core provider');
  }
} 