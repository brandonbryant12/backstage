export const sourceAEntities = {
  entities: [
    // Test Case 1: Component that exists in both sources - will be merged
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'service-1',
        namespace: 'default',
        description: 'Service 1 from Source A',
        annotations: {
          'source-a': 'true',
          'common-annotation': 'source-a-value',
          'backstage.io/techdocs-ref': 'dir:.',
        },
        labels: {
          'team': 'team-a',
          'common-label': 'source-a-value',
        },
        tags: ['java', 'spring', 'common-tag'],
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'team-a',
        dependsOn: ['component:default/database-1'],
        providesApis: ['api:default/api-1'],
        consumesApis: ['api:default/external-1'],
        system: 'system-a',
      }
    },
    // Test Case 2: Component that exists only in Source A
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'service-2',
        namespace: 'default',
        description: 'Source A only service',
        annotations: {
          'source-a-unique': 'true',
        },
        tags: ['source-a-only'],
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'team-a',
        dependsOn: ['component:default/unique-to-a'],
      }
    },
    // Test Case 3: API that exists in both sources - Source A will take precedence
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'api-1',
        namespace: 'default',
        description: 'API from Source A - should take precedence',
        annotations: {
          'source-a': 'true',
        },
      },
      spec: {
        type: 'openapi',
        lifecycle: 'production',
        owner: 'team-a',
        definition: 'openapi: 3.0.0'
      }
    },
    // Test Case 4: Group that exists in both sources - Source A will take precedence
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: 'team-a',
        description: 'Team A from Source A - should take precedence',
        annotations: {
          'source-a': 'true',
        },
      },
      spec: {
        type: 'team',
        profile: {
          displayName: 'Team A',
          email: 'team-a@company.com',
        },
        parent: 'engineering',
        children: []
      }
    }
  ]
};
