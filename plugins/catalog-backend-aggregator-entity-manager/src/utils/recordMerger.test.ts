import { mergeRecords } from './recordMerger';
import { EntityRecord } from '../types';

describe('mergeRecords', () => {
  it('merges arrays and annotations while respecting priority', () => {
    const records: EntityRecord[] = [
      {
        dataSource: 'a',
        entityRef: 'component:default/name',
        metadata: {
          name: 'name',
          annotations: { 'a.com/test': 'value1' },
          tags: ['typescript'],
          links: [{ url: 'http://example.com', title: 'doc' }]
        },
        spec: {
          providesApis: ['api-1'],
          owner: ['team-a']
        },
        priorityScore: 100,
      },
      {
        dataSource: 'b',
        entityRef: 'component:default/name',
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
        },
        priorityScore: 50,
      }
    ];

    const merged = mergeRecords(records);

    expect(merged.dataSource).toBe('a');
    expect(merged.metadata.name).toBe('name');
    
    expect(merged.metadata.annotations).toMatchObject({
      'a.com/test': 'value1',
      'b.com/test': 'value2'
    });

    expect(merged.metadata.tags).toEqual(expect.arrayContaining(['typescript', 'react']));
    
    const linkTitles = merged.metadata.links?.map(l => l.title) as string[];
    expect(linkTitles).toContain('doc');
    expect(linkTitles).toContain('other');
    
    expect(merged.spec.owner).toEqual(expect.arrayContaining(['team-a', 'team-b']));
    expect(merged.spec.providesApis).toEqual(expect.arrayContaining(['api-1', 'api-2']));
    expect(merged.spec.dependsOn).toEqual(['redis-cache']);
    expect(merged.metadata.tags?.length).toBe(2);
    expect(merged.metadata.links?.length).toBe(2);
    expect(merged.spec.owner?.length).toBe(2);
    expect(merged.spec.providesApis?.length).toBe(2);
    expect(merged.spec.dependsOn?.length).toBe(1);
  });

  it('throws error for empty records', () => {
    expect(() => mergeRecords([])).toThrow('Cannot merge empty records array');
  });
});