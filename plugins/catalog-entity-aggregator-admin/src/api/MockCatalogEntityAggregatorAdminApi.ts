import { CatalogEntityAggregatorAdminApi } from './CatalogEntityAggregatorAdminApi';

export const mockCatalogEntityAggregatorAdminApi: CatalogEntityAggregatorAdminApi = {
  async getRawEntities(entityRef: string) {
    return {
      entities: [
        {
          providerId: 'mock-provider',
          entityRef,
          entity: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'mock-entity' },
            spec: {},
          },
          priority: 50,
        },
      ],
      mergedEntity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'mock-entity' },
        spec: {},
      },
    };
  },

  async getAllEntities() {
    return [
      {
        entityRef: 'component:default/mock-entity-1',
        providerCount: 2,
      },
      {
        entityRef: 'component:default/mock-entity-2',
        providerCount: 3,
      },
    ];
  },
};