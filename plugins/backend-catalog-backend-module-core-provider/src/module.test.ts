import { startTestBackend } from '@backstage/backend-test-utils';
import { backendCatalogModuleCoreProvider } from './module';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { ConfigReader } from '@backstage/config';

// Mock the data sources
jest.mock('./datasources/sourceA/entityDataA', () => ({
  sourceAEntities: { entities: [] },
}));

jest.mock('./datasources/sourceB/entityDataB', () => ({
  sourceBEntities: { entities: [] },
}));

// Import the mocked modules
import { sourceAEntities } from './datasources/sourceA/entityDataA';
import { sourceBEntities } from './datasources/sourceB/entityDataB';

describe('backendCatalogModuleCoreProvider', () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const config = new ConfigReader({});
  let addedEntities: any[] = [];
  let removedEntities: any[] = [];
  let mockConnection: any;

  beforeEach(() => {
    jest.resetAllMocks();
    addedEntities = [];
    removedEntities = [];
    mockConnection = {
      applyMutation: jest.fn(async ({ type, added, removed }) => {
        if (type === 'delta') {
          addedEntities.push(...added);
          removedEntities.push(...removed);
        }
      }),
    };
  });

  const createBackend = async () => {
    const extensionPoint = { addEntityProvider: jest.fn() }
    return await startTestBackend({
      features: [backendCatalogModuleCoreProvider],
      extensionPoints: [[catalogProcessingExtensionPoint, extensionPoint]]
    });
  };

  describe('Source A only scenarios', () => {
    const sourceAOnlyData = {
      entities: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'service-a',
            annotations: { 'source-a': 'true' },
            tags: ['source-a'],
          },
        },
      ],
    };

    beforeEach(() => {
      (sourceAEntities as any).entities = sourceAOnlyData.entities;
      (sourceBEntities as any).entities = [];
    });

    it('should process entities from source A when source B is empty', async () => {
      await createBackend();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(addedEntities.length).toBe(1);
      expect(addedEntities[0].entity.metadata.name).toBe('service-a');
      expect(addedEntities[0].entity.metadata.annotations['source-a']).toBe('true');
    });

    it('should handle POST updates to source A entities', async () => {
      const { httpRouter } = await createBackend();

      // Mock existing entity in cache
      mockCache.get.mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'service-a',
          annotations: { 'source-a': 'true' },
          tags: ['source-a'],
        },
      });

      const response = await httpRouter.post('/catalog/core-provider/entities/component:default/service-a', {
        body: {
          metadata: {
            annotations: { 'new-annotation': 'value' },
            tags: ['new-tag'],
          },
        },
      });

      expect(response.status).toBe(200);
      const updatedEntity = await response.json();
      expect(updatedEntity.metadata.annotations).toEqual({
        'source-a': 'true',
        'new-annotation': 'value',
      });
      expect(updatedEntity.metadata.tags).toEqual(['source-a', 'new-tag']);
    });
  });

  describe('Source B only scenarios', () => {
    const sourceBOnlyData = {
      entities: [
        {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'service-b',
            annotations: { 'source-b': 'true' },
            tags: ['source-b'],
          },
        },
      ],
    };

    beforeEach(() => {
      (sourceAEntities as any).entities = [];
      (sourceBEntities as any).entities = sourceBOnlyData.entities;
    });

    it('should not process entities from source B when source A is empty', async () => {
      await createBackend();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(addedEntities.length).toBe(0);
    });
  });

  describe('Source A and B merge scenarios', () => {
    const mergeTestData = {
      sourceA: {
        entities: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'merge-service',
              namespace: 'default',
              annotations: { 
                'source-a': 'true',
                'common': 'source-a-value',
              },
              tags: ['tag-a', 'common-tag'],
            },
            spec: {
              type: 'service',
              owner: 'team-a',
            },
          },
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'API',
            metadata: {
              name: 'api-1',
              annotations: { 'source-a': 'true' },
            },
            spec: {
              type: 'openapi',
            },
          },
        ],
      },
      sourceB: {
        entities: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'merge-service',
              namespace: 'default',
              annotations: { 
                'source-b': 'true',
                'common': 'source-b-value',
              },
              tags: ['tag-b', 'common-tag'],
            },
            spec: {
              type: 'website',
              owner: 'team-b',
            },
          },
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'API',
            metadata: {
              name: 'api-1',
              annotations: { 'source-b': 'true' },
            },
            spec: {
              type: 'graphql',
            },
          },
        ],
      },
    };

    beforeEach(() => {
      (sourceAEntities as any).entities = mergeTestData.sourceA.entities;
      (sourceBEntities as any).entities = mergeTestData.sourceB.entities;
    });

    it('should correctly merge Component entities from both sources', async () => {
      await createBackend();

      await new Promise(resolve => setTimeout(resolve, 100));

      const mergedComponent = addedEntities.find(
        e => e.entity.metadata.name === 'merge-service'
      );

      expect(mergedComponent).toBeDefined();
      expect(mergedComponent.entity.metadata.annotations).toEqual({
        'source-a': 'true',
        'source-b': 'true',
        'common': 'source-a-value',
        'backstage.io/managed-by-location': expect.any(String),
        'backstage.io/managed-by-origin-location': expect.any(String),
      });
      expect(mergedComponent.entity.metadata.tags).toEqual(['tag-a', 'common-tag', 'tag-b']);
      expect(mergedComponent.entity.spec.type).toBe('service'); // Source A takes precedence
      expect(mergedComponent.entity.spec.owner).toBe('team-a'); // Source A takes precedence
    });

    it('should preserve Source A values for non-Component entities', async () => {
      await createBackend();

      await new Promise(resolve => setTimeout(resolve, 100));

      const api = addedEntities.find(e => e.entity.metadata.name === 'api-1');
      expect(api).toBeDefined();
      expect(api.entity.spec.type).toBe('openapi');
      expect(api.entity.metadata.annotations['source-a']).toBe('true');
      expect(api.entity.metadata.annotations['source-b']).toBeUndefined();
    });
  });
}); 