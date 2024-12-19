export interface CatalogEntityAggregatorAdminApi {
  /**
   * Retrieves raw entities from the aggregator
   */
  getRawEntities(entityRef: string): Promise<{
    entities: {
      datasource: string;
      entity: {
        apiVersion: string;
        kind: string;
        metadata: any;
        spec: any;
      };
    }[];
    mergedEntity: {
      apiVersion: string;
      kind: string;
      metadata: any;
      spec: any;
    };
  }>;
} 