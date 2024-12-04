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
          description: `Service ${id} description from Source B`,
          labels: {
            'tier': 'backend',
            'region': 'eu-west'
          },
          tags: ['typescript', 'fastify', 'backend'],
          links: [
            {
              url: `https://example.com/service-${id}/runbook`,
              title: 'Runbook',
              icon: 'book'
            }
          ],
          annotations: {
            'grafana/dashboard-selector': `service-${id}-*`,
            'prometheus/alert-rule': `service-${id}-alerts`,
            'DataSourceB': 'secondary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-b',
          system: 'payment-system',
          providesApis: [`api-${id}`, `api-${id}-metrics`],
          consumesApis: ['auth-api', 'logging-api'],
          dependsOn: ['resource:redis-cache', 'component:logging-service']
        }
      },

      // API
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: {
          name: `api-${id}`,
          namespace: 'default',
          description: `API ${id} from Source B`,
          tags: ['rest', 'v2', 'secured'],
          annotations: {
            'DataSourceB': 'secondary-source',
            'timestamp': timestamp
          }
        },
        spec: {
          type: 'openapi',
          lifecycle: 'production',
          owner: 'team-b',
          definition: JSON.stringify({
            openapi: '3.0.0',
            info: {
              title: `API ${id}`,
              version: '2.0.0',
              description: `Enhanced OpenAPI specification for API ${id}`
            }
          }),
          system: 'payment-system'
        }
      },

      // System
      {
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
      }
    ];
  }).flat();
};

export class DataSourceB extends DataSource {
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
      refreshSchedule: config.refreshSchedule || '*/40 * * * * *', // Run every 40 seconds by default
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