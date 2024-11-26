export const sourceBEntities = {
  entities: [
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'service-1',
        namespace: 'default',
        description: 'Service 1 from Source B',
        annotations: {
          'source-b': 'true',
          'common-annotation': 'source-b-value',
          'jenkins/job': 'service-1-build',
        },
        labels: {
          'tier': 'frontend',
          'common-label': 'source-b-value',
        },
        tags: ['typescript', 'react', 'common-tag'],
      },
      spec: {
        type: 'website',
        lifecycle: 'staging',
        owner: 'team-b',
        dependsOn: ['component:default/database-2'],
        providesApis: ['api:default/api-2'],
        consumesApis: ['api:default/external-2'],
        system: 'system-b',
      }
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'service-3',
        namespace: 'default',
        description: 'Source B only service',
        annotations: {
          'source-b-unique': 'true',
        },
        tags: ['source-b-only'],
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'team-b',
        dependsOn: ['component:default/unique-to-b'],
      }
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'api-1',
        namespace: 'default',
        description: 'API from Source B - should be ignored',
        annotations: {
          'source-b': 'true',
        },
      },
      spec: {
        type: 'grpc',
        lifecycle: 'production',
        owner: 'team-b',
        definition: 'proto3'
      }
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: 'team-a',
        description: 'Team A from Source B - should be ignored',
        annotations: {
          'source-b': 'true',
        },
      },
      spec: {
        type: 'team',
        profile: {
          displayName: 'Team A - Source B',
          email: 'team-a-b@company.com',
        },
        parent: 'product',
        children: []
      }
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'api-2',
        namespace: 'default',
        description: 'API only from Source B - should be added',
        annotations: {
          'source-b-unique': 'true',
        },
      },
      spec: {
        type: 'graphql',
        lifecycle: 'production',
        owner: 'team-b',
        definition: 'type Query { ... }'
      }
    }
  ]
};
