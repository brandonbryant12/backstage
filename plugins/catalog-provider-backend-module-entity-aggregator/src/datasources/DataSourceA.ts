import { Entity } from '@backstage/catalog-model';
import { DataSource } from './DataSource';

export class DataSourceA extends DataSource {
  async fetchEntities(): Promise<Entity[]> {
    const timestamp = new Date().toISOString();
    return Array.from({ length: 10 }, (_, i) => ({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: `component-${i}`,
        namespace: 'default',
        annotations: {
          'backstage.io/managed-by-location': 'url:http://example.com/component-a',
          'backstage.io/managed-by-origin-location': 'url:http://example.com/component-a',
          'DataSourceA': "!!!!!!",
          'timestamp': timestamp
        },
      },
      spec: {
        type: 'service',
        lifecycle: 'experimental',
        owner: 'team-a',
      },
    }));
  }
}