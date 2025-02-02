import { mergeRecords } from './recordMerger';
import { type EntityFragmentRecord } from '@core/plugin-catalog-backend-module-aggregator-entity-manager';

describe('mergeRecords', () => {
  it('merges arrays and annotations while respecting priority', () => {
    const records: EntityFragmentRecord[] = [
      {
        provider_id: 'a',
        entity_ref: 'component:default/name',
        kind: 'Component',
        content_hash: '12',
        needs_processing: true,
        entity_json: JSON.stringify({
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'name',
            annotations: { 'a.com/test': 'value1' },
            tags: ['typescript'],
            links: [{ url: 'http://example.com', title: 'doc' }]
          },
          spec: {
            providesApis: ['api-1'],
            owner: ['team-a']
          }
        }),
        priority: 100,
      },
      {
        provider_id: 'b',
        entity_ref: 'component:default/name',
        kind: 'Component',
        content_hash: '12',
        needs_processing: true,
        entity_json: JSON.stringify({
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'Component',
          metadata: {
            name: 'different-name',
            annotations: { 'b.com/test': 'value2' },
            tags: ['react'],
            links: [{ url: 'http://other.com', title: 'other' }]
          },
          spec: {
            providesApis: ['api-2'],
            dependsOn: ['redis-cache'],
            owner: ['team-b']
          }
        }),
        priority: 50,
      }
    ];

    const merged = mergeRecords(records);

    expect(merged.kind).toBe('Component');
    expect(merged.apiVersion).toBe('backstage.io/v1alpha1');
    expect(merged.metadata.name).toBe('name');
    
    expect(merged.metadata.annotations).toMatchObject({
      'a.com/test': 'value1',
      'b.com/test': 'value2'
    });

    expect(merged.metadata.tags).toEqual(expect.arrayContaining(['typescript', 'react']));
    
    const linkTitles = merged.metadata.links?.map(l => l.title) as string[];
    expect(linkTitles).toContain('doc');
    expect(linkTitles).toContain('other');
    
    expect(merged.spec?.owner).toEqual(expect.arrayContaining(['team-a', 'team-b']));
    expect(merged.spec?.providesApis).toEqual(expect.arrayContaining(['api-1', 'api-2']));
    expect(merged.spec?.dependsOn).toEqual(['redis-cache']);
    expect(merged.metadata.tags?.length).toBe(2);
    expect(merged.metadata.links?.length).toBe(2);
  });

  it('throws error for empty records', () => {
    expect(() => mergeRecords([])).toThrow('Cannot merge empty records array');
  });
});