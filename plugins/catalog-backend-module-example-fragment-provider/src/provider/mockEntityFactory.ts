import { Entity } from '@backstage/catalog-model';

export interface MockEntityOptions {
  source: string;
  tier?: 'frontend' | 'backend';
  team?: string;
  apiVersion?: string;
}

export function generateMockEntities(count: number, options: MockEntityOptions): Entity[] {
  const timestamp = new Date().toISOString();
  const { source, tier = 'frontend', team = 'team-a' } = options;

  return Array.from({ length: count }, (_, i) => {
    const id = `${i}`;
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: `service-${id}`,
        namespace: 'default',
        description: `Service ${id} description from ${source}`,
        labels: {
          tier,
          criticality: 'high',
        },
        tags: [
          'typescript',
          tier === 'frontend' ? 'react' : 'fastify',
          tier,
        ],
        links: [
          {
            url: `https://example.com/service-${id}/docs`,
            title: 'Documentation',
            icon: 'doc'
          }
        ],
        annotations: {
          'backstage.io/techdocs-ref': 'dir:.',
          'jenkins.io/job-full-name': `service-${id}-ci`,
          'source': source,
          'timestamp': timestamp
        }
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: team,
        system: 'payment-system',
        providesApis: [
          `api-${id}`,
          `api-${id}-admin`
        ],
        consumesApis: [
          'auth-api',
          'billing-api'
        ],
        dependsOn: [
          'resource:redis-cache',
          'component:auth-service'
        ]
      }
    };
  });
} 