import { mergeRecords } from './recordMerger';
import { EntityRecord } from '../types';

describe('mergeRecords', () => {
  it('merges arrays and annotations correctly', () => {
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
          name: 'name',
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
    expect(merged.metadata.annotations).toMatchObject({
      'a.com/test': 'value1',
      'b.com/test': 'value2'
    });
    expect(merged.metadata.tags).toEqual(expect.arrayContaining(['typescript', 'react']));
    const linkTitles = merged.metadata.links?.map(l => l.title) as string[];
    expect(linkTitles).toContain('doc');
    expect(linkTitles).toContain('other');
    expect(merged.spec.owner).toEqual(['team-a', 'team-b']);
    expect(merged.spec.providesApis).toEqual(['api-1', 'api-2']);
    expect(merged.spec.dependsOn).toEqual(['redis-cache']);
  });

  it('throws error for empty records', () => {
    expect(() => mergeRecords([])).toThrow('Cannot merge empty records array');
  });
});