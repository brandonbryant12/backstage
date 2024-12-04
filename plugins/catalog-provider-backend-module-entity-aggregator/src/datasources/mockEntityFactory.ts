import { Entity } from '@backstage/catalog-model';

export interface MockEntityOptions {
  source: 'DataSourceA' | 'DataSourceB';
  tier?: 'frontend' | 'backend';
  team?: 'team-a' | 'team-b';
  apiVersion?: string;
}

export function generateMockEntities(count: number, options: MockEntityOptions): Entity[] {
  const timestamp = new Date().toISOString();
  const { source, tier = 'frontend', team = 'team-a', apiVersion = 'v1' } = options;

  return Array.from({ length: count }, (_, i) => {
    const id = `${i}`;
    return [
      // Component
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: `service-${id}`,
          namespace: 'default',
          description: `Service ${id} description from Source ${source === 'DataSourceA' ? 'A' : 'B'}`,
          labels: source === 'DataSourceA' 
            ? { tier, criticality: 'high' }
            : { tier, region: 'eu-west' },
          tags: [
            'typescript',
            tier === 'frontend' ? 'react' : 'fastify',
            tier,
          ],
          links: [
            {
              url: `https://example.com/service-${id}/${source === 'DataSourceA' ? 'docs' : 'runbook'}`,
              title: source === 'DataSourceA' ? 'Documentation' : 'Runbook',
              icon: source === 'DataSourceA' ? 'doc' : 'book'
            }
          ],
          annotations: {
            ...(source === 'DataSourceA' ? {
              'backstage.io/techdocs-ref': 'dir:.',
              'jenkins.io/job-full-name': `service-${id}-ci`,
            } : {
              'grafana/dashboard-selector': `service-${id}-*`,
              'prometheus/alert-rule': `service-${id}-alerts`,
            }),
            [source]: source === 'DataSourceA' ? 'primary-source' : 'secondary-source',
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
            `api-${id}-${source === 'DataSourceA' ? 'admin' : 'metrics'}`
          ],
          consumesApis: [
            'auth-api',
            source === 'DataSourceA' ? 'billing-api' : 'logging-api'
          ],
          dependsOn: [
            'resource:redis-cache',
            `component:${source === 'DataSourceA' ? 'auth' : 'logging'}-service`
          ]
        }
      },

      // API
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: {
          name: `api-${id}`,
          namespace: 'default',
          description: `API ${id} from Source ${source === 'DataSourceA' ? 'A' : 'B'}`,
          tags: ['rest', apiVersion, source === 'DataSourceB' ? 'secured' : undefined].filter(Boolean),
          annotations: {
            ...(source === 'DataSourceA' ? {
              'backstage.io/techdocs-ref': 'dir:.',
              'jenkins.io/job-full-name': `service-${id}-ci`,
            } : {}),
            [source]: source === 'DataSourceA' ? 'primary-source' : 'secondary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          type: 'openapi',
          lifecycle: 'production',
          owner: team,
          definition: JSON.stringify({
            openapi: '3.0.0',
            info: {
              title: `API ${id}`,
              version: source === 'DataSourceA' ? '1.0.0' : '2.0.0',
              description: source === 'DataSourceA' 
                ? `OpenAPI specification for API ${id}`
                : `Enhanced OpenAPI specification for API ${id}`
            }
          }),
          system: 'payment-system'
        }
      },

      // Entity specific to source (User for A, System for B)
      ...(source === 'DataSourceA' ? [{
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: `user-${id}`,
          namespace: 'default',
          description: `User ${id} from Source A`,
          annotations: {
            'backstage.io/techdocs-ref': 'dir:.',
            'jenkins.io/job-full-name': `service-${id}-ci`,
            'DataSourceA': 'primary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          profile: {
            displayName: `User ${id}`,
            email: `user-${id}@example.com`
          },
          memberOf: ['team-a']
        }
      }] : [{
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'System',
        metadata: {
          name: `system-${id}`,
          namespace: 'default',
          description: `System ${id} from Source B`,
          annotations: {
            'DataSourceB': 'secondary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          owner: 'team-b',
          domain: `domain-${id}`,
          dependsOn: ['resource:redis-cache']
        }
      }])
    ];
  }).flat();
} 