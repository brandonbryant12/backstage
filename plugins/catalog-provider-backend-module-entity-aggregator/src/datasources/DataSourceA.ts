import { Entity } from '@backstage/catalog-model';
import { DataSource } from './DataSource';

const generateEntities = (count: number): Entity[] => {
  const timestamp = new Date().toISOString();
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
          description: `Service ${id} description from Source A`,
          labels: {
            'tier': 'frontend',
            'criticality': 'high'
          },
          tags: ['typescript', 'react', 'frontend'],
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
            'DataSourceA': 'primary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-a',
          system: 'payment-system',
          providesApis: [`api-${id}`, `api-${id}-admin`],
          consumesApis: ['auth-api', 'billing-api'],
          dependsOn: ['resource:redis-cache', 'component:auth-service']
        }
      },

      // API
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: {
          name: `api-${id}`,
          namespace: 'default',
          description: `API ${id} from Source A`,
          tags: ['rest', 'v1'],
          annotations: {
            'backstage.io/techdocs-ref': 'dir:.',
            'jenkins.io/job-full-name': `service-${id}-ci`,
            'DataSourceA': 'primary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          type: 'openapi',
          lifecycle: 'production',
          owner: 'team-a',
          definition: JSON.stringify({
            openapi: '3.0.0',
            info: {
              title: `API ${id}`,
              version: '1.0.0',
              description: `OpenAPI specification for API ${id}`
            }
          }),
          system: 'payment-system'
        }
      },

      // User
      {
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
      }
    ];
  }).flat(); // Flatten the array of arrays
};

export class DataSourceA extends DataSource {
  async fetchEntities(): Promise<Entity[]> {
    // Generate 5 of each entity type (15 total entities)
    return generateEntities(10);
  }
}