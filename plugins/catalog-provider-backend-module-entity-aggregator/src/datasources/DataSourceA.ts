import { Entity } from '@backstage/catalog-model';
import { DataSource } from './DataSource';
import { chunk } from 'lodash';
import { LoggerService } from '@backstage/backend-plugin-api';


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
  constructor(
    config: { 
      name: string; 
      priority: number; 
      refreshSchedule?: string;
    },
    logger: LoggerService,
  ) {
    super({
      ...config,
      refreshSchedule: config.refreshSchedule || '*/20 * * * * *', // Run every 20 seconds by default
    }, logger);
  }

  async refresh(provide: (entities: Entity[]) => Promise<void>): Promise<void> {
    try {
      // Generate test entities (10 of each type)
      const entities = generateEntities(10);
      
      // Process in chunks of 100 entities
      const chunks = chunk(entities, 100);
      
      for (const batch of chunks) {
        this.logger.debug(`Processing batch of ${batch.length} entities`);
        await provide(batch);
      }
      
      this.logger.info(`Successfully refreshed ${entities.length} entities`);
    } catch (error) {
      const message = `Failed to refresh entities for ${this.getName()}`;
      this.logger.error(message, error);
    }
  }
}