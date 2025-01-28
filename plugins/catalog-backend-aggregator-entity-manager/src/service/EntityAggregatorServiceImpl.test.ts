import { EntityAggregatorServiceImpl } from './EntityAggregatorServiceImpl';
import { EntityFragmentRepository } from '../database/EntityFragmentRepository';
import { Entity } from '@backstage/catalog-model';

describe('EntityAggregatorServiceImpl', () => {
  let repository: jest.Mocked<EntityFragmentRepository>;
  let service: EntityAggregatorServiceImpl;

  beforeEach(() => {
    repository = {
      updateOrCreateMany: jest.fn(),
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
});