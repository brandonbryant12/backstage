import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { EntityFragmentRepository } from '../database/EntityFragmentRepository';
import { Entity } from '@backstage/catalog-model';

describe('EntityFragmentStagingServiceImpl', () => {
  let repository: jest.Mocked<EntityFragmentRepository>;
  let service: EntityAggregatorServiceImpl;

  const mockEntityFragmentRecord = {
    provider_id: 'test-provider',
    entity_ref: 'component:default/test',
    kind: 'Component',
    entity_json: JSON.stringify({
      apiVersion: 'v1',
      kind: 'Component',
      metadata: { name: 'test', namespace: 'default' },
      spec: {},
    }),
    priority: 100,
    content_hash: 'mock-hash',
    needs_processing: true,
    expires_at: new Date('2024-12-31'),
  };

  beforeEach(() => {
    repository = {
      updateOrCreateMany: jest.fn(),
      getEntityRecordsByEntityRef: jest.fn(),
      listEntityRefs: jest.fn(),
      findEntityGroupsByEntityRef: jest.fn(),
      markAsProcessed: jest.fn(),
      getExpiredEntityRefs: jest.fn(),
      removeByEntityRefs: jest.fn(),
    } as unknown as jest.Mocked<EntityFragmentRepository>;
    
    service = new EntityAggregatorServiceImpl(repository);
  });

  it('updates or creates entity fragments', async () => {
    const testEntity: Entity = {
      apiVersion: 'v1',
      kind: 'Component',
      metadata: { name: 'test', namespace: 'default' },
      spec: {},
    };

    const expiresAt = new Date();
    await service.updateOrCreateEntityFragments(
      'test-provider',
      [testEntity],
      100,
      expiresAt
    );

    expect(repository.updateOrCreateMany).toHaveBeenCalledWith(
      'test-provider',
      [testEntity],
      100,
      expiresAt
    );
  });

  it('gets records by entity ref', async () => {
    const mockRecords = [mockEntityFragmentRecord];
    repository.getEntityRecordsByEntityRef.mockResolvedValue(mockRecords);

    const result = await service.getRecordsByEntityRef('component:default/test');
    
    expect(result).toEqual(mockRecords);
    expect(repository.getEntityRecordsByEntityRef).toHaveBeenCalledWith('component:default/test');
  });

  it('lists entity refs with provider counts', async () => {
    const mockList = [{ entityRef: 'component:default/test', providerCount: 2 }];
    repository.listEntityRefs.mockResolvedValue(mockList);

    const result = await service.listEntityRefs();
    
    expect(result).toEqual(mockList);
    expect(repository.listEntityRefs).toHaveBeenCalled();
  });

  it('finds entity groups by entity ref', async () => {
    const mockGroups = [[mockEntityFragmentRecord]];
    const options = { kind: 'Component', needsProcessing: true, batchSize: 10 };
    repository.findEntityGroupsByEntityRef.mockResolvedValue(mockGroups);

    const result = await service.findEntityGroupsByEntityRef(options);
    
    expect(result).toEqual(mockGroups);
    expect(repository.findEntityGroupsByEntityRef).toHaveBeenCalledWith(options);
  });

  it('marks entities as processed', async () => {
    const entityRefs = ['component:default/test1', 'component:default/test2'];
    await service.markEntitiesAsProcessed(entityRefs);
    
    expect(repository.markAsProcessed).toHaveBeenCalledWith(entityRefs);
  });

  it('skips marking entities as processed when array is empty', async () => {
    await service.markEntitiesAsProcessed([]);
    
    expect(repository.markAsProcessed).not.toHaveBeenCalled();
  });

  it('gets expired record entity refs', async () => {
    const mockRefs = ['component:default/test'];
    repository.getExpiredEntityRefs.mockResolvedValue(mockRefs);

    const result = await service.getExpiredRecordEntityRefs('Component');
    
    expect(result).toEqual(mockRefs);
    expect(repository.getExpiredEntityRefs).toHaveBeenCalledWith('Component');
  });

  it('removes records by entity refs', async () => {
    const entityRefs = ['component:default/test1', 'component:default/test2'];
    await service.removeRecords(entityRefs);
    
    expect(repository.removeByEntityRefs).toHaveBeenCalledWith(entityRefs);
  });

  it('skips removing records when array is empty', async () => {
    await service.removeRecords([]);
    
    expect(repository.removeByEntityRefs).not.toHaveBeenCalled();
  });
});