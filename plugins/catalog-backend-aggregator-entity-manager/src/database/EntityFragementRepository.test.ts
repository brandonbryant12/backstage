import { mockServices, TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import { EntityFragmentRepository } from './EntityFragmentRepository';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';

describe('EntityFragmentRepository', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_16', 'SQLITE_3'],
  });

  async function createStore(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    const logger: LoggerService = mockServices.logger.mock();
    const database = {
      getClient: async () => knex,
    };
    return {
      store: await EntityFragmentRepository.create(database, logger),
      knex,
      logger,
    };
  }

  it.each(databases.eachSupportedId())('should create and update records with kind', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };

    await store.updateOrCreateMany('test-source', [entity], 100);

    const result = await knex('staging_entity_fragments').select();
    expect(result).toHaveLength(1);
    expect(result[0].provider_id).toBe('test-source');
    expect(result[0].entity_ref).toBe('component:default/service-1');
    expect(result[0].kind).toBe('Component');
    expect(JSON.parse(result[0].entity_json)).toEqual(entity);
  });

  it.each(databases.eachSupportedId())('should handle entities of different kinds', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    const entities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-1', namespace: 'default' },
        spec: {},
      },
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: { name: 'api-1', namespace: 'default' },
        spec: {},
      },
    ];

    await store.updateOrCreateMany('test-source', entities, 100);

    const results = await knex('staging_entity_fragments')
      .select()
      .orderBy('kind', 'asc');
    
    expect(results).toHaveLength(2);
    expect(results[0].kind).toBe('API');
    expect(results[1].kind).toBe('Component');
  });

  it.each(databases.eachSupportedId())('should handle empty batch', async databaseId => {
    const { store, knex } = await createStore(databaseId);

    await store.updateOrCreateMany('test-source', [], 100);

    const result = await knex('staging_entity_fragments').select();
    expect(result).toHaveLength(0);
  });

  it.each(databases.eachSupportedId())('should get entity records by ref', async databaseId => {
    const { store } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };

    await store.updateOrCreateMany('test-source', [entity], 100);

    const records = await store.getEntityRecordsByEntityRef('component:default/service-1');

    expect(records).toHaveLength(1);
    expect(records[0].entity_ref).toBe('component:default/service-1');
    expect(records[0].provider_id).toBe('test-source');
    expect(records[0].kind).toBe('Component');
    expect(JSON.parse(records[0].entity_json)).toEqual(entity);
  });

  it.each(databases.eachSupportedId())('should normalize entity ref when querying records', async databaseId => {
    const { store } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };

    await store.updateOrCreateMany('test-source', [entity], 100);

    const records = await store.getEntityRecordsByEntityRef('COMPONENT:DEFAULT/SERVICE-1');

    expect(records).toHaveLength(1);
    expect(records[0].entity_ref).toBe('component:default/service-1');
  });

  it.each(databases.eachSupportedId())('should find and group entities by ref', async databaseId => {
    const { store } = await createStore(databaseId);
    const entities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-1', namespace: 'default' },
        spec: {},
      },
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: { name: 'api-1', namespace: 'default' },
        spec: {},
      },
    ];

    await store.updateOrCreateMany('source-a', [entities[0]], 50);
    await store.updateOrCreateMany('source-b', [entities[0]], 100);
    await store.updateOrCreateMany('source-c', [entities[1]], 75);

    const allGroups = await store.findEntityGroupsByEntityRef({});

    expect(allGroups).toHaveLength(2);
    expect(allGroups[0][0].entity_ref).toBe('api:default/api-1');
    expect(allGroups[1][0].entity_ref).toBe('component:default/service-1');
    expect(allGroups[1]).toHaveLength(2);
    expect(allGroups[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider_id: 'source-a', priority: 50 }),
        expect.objectContaining({ provider_id: 'source-b', priority: 100 }),
      ])
    );

    const componentGroups = await store.findEntityGroupsByEntityRef({ kind: 'Component' });
    expect(componentGroups).toHaveLength(1);
    expect(componentGroups[0][0].kind).toBe('Component');

    const limitedGroups = await store.findEntityGroupsByEntityRef({ batchSize: 1 });
    expect(limitedGroups).toHaveLength(1);
  });

  it.each(databases.eachSupportedId())('should handle needs_processing filter', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };

    await store.updateOrCreateMany('source-a', [entity], 50);
    await knex('staging_entity_fragments')
      .where('entity_ref', 'component:default/service-1')
      .update('needs_processing', false);

    const needsProcessingGroups = await store.findEntityGroupsByEntityRef({ needsProcessing: true });
    expect(needsProcessingGroups).toHaveLength(0);

    await store.updateOrCreateMany('source-a', [entity], 51);

    const updatedGroups = await store.findEntityGroupsByEntityRef({ needsProcessing: true });
    expect(updatedGroups).toHaveLength(1);
    expect(!!updatedGroups[0][0].needs_processing).toBe(true);
  });

  it.each(databases.eachSupportedId())('should handle expired entities', async databaseId => {
    const { store } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };

    const pastDate = new Date(Date.now() - 10000);
    await store.updateOrCreateMany('source-a', [entity], 50, pastDate);

    const groups = await store.findEntityGroupsByEntityRef({});
    expect(groups).toHaveLength(0);
  });

  it.each(databases.eachSupportedId())('should get expired entity refs when all records are expired', async databaseId => {
    const { store } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };
    const pastDate = new Date(Date.now() - 10000);

    await store.updateOrCreateMany('source-a', [entity], 50, pastDate);
    await store.updateOrCreateMany('source-b', [entity], 100, pastDate);

    const expiredRefs = await store.getExpiredEntityRefs('Component');

    expect(expiredRefs).toEqual(['component:default/service-1']);
  });

  it.each(databases.eachSupportedId())('should not get entity ref when any record is not expired', async databaseId => {
    const { store } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };
    const pastDate = new Date(Date.now() - 10000);
    const futureDate = new Date(Date.now() + 10000);

    await store.updateOrCreateMany('source-a', [entity], 50, pastDate);
    await store.updateOrCreateMany('source-b', [entity], 100, futureDate);

    const expiredRefs = await store.getExpiredEntityRefs('Component');

    expect(expiredRefs).toEqual([]);
  });

  it.each(databases.eachSupportedId())('should remove expired records', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };

    const pastDate = new Date(Date.now() - 10000);
    const futureDate = new Date(Date.now() + 10000);

    // Add one expired and one non-expired record
    await store.updateOrCreateMany('source-a', [entity], 50, pastDate);
    await store.updateOrCreateMany('source-b', [entity], 100, futureDate);

    const removedCount = await store.removeExpiredRecords();

    expect(removedCount).toBe(1);
    const remaining = await knex('staging_entity_fragments').select();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].provider_id).toBe('source-b');
  });

  it.each(databases.eachSupportedId())('should list entity refs with provider counts', async databaseId => {
    const { store } = await createStore(databaseId);
    const entities: Entity[] = [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-1', namespace: 'default' },
        spec: {},
      },
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: { name: 'api-1', namespace: 'default' },
        spec: {},
      },
    ];

    // Add multiple providers for the first entity
    await store.updateOrCreateMany('source-a', [entities[0]], 50);
    await store.updateOrCreateMany('source-b', [entities[0]], 100);
    // Add single provider for the second entity
    await store.updateOrCreateMany('source-c', [entities[1]], 75);

    const entityRefs = await store.listEntityRefs();

    expect(entityRefs).toHaveLength(2);
    expect(entityRefs).toContainEqual({
      entityRef: 'api:default/api-1',
      providerCount: 1,
    });
    expect(entityRefs).toContainEqual({
      entityRef: 'component:default/service-1',
      providerCount: 2,
    });
  });

  it.each(databases.eachSupportedId())('should handle empty arrays in removeByEntityRefs', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    
    // Should not throw error and should be a no-op
    await store.removeByEntityRefs([]);

    // Verify no delete query was executed
    const spyDelete = jest.spyOn(knex, 'delete');
    expect(spyDelete).not.toHaveBeenCalled();
  });

  it.each(databases.eachSupportedId())('should handle empty arrays in markAsProcessed', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    
    // Should not throw error and should be a no-op
    await store.markAsProcessed([]);

    // Verify no update query was executed
    const spyUpdate = jest.spyOn(knex, 'update');
    expect(spyUpdate).not.toHaveBeenCalled();
  });

  it.each(databases.eachSupportedId())('should mark multiple entities as processed', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    const entity1: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-1', namespace: 'default' },
      spec: {},
    };
    const entity2: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'service-2', namespace: 'default' },
      spec: {},
    };

    await store.updateOrCreateMany('source-a', [entity1, entity2], 50);
    
    const entityRefs = [
      'component:default/service-1',
      'component:default/service-2'
    ];
    await store.markAsProcessed(entityRefs);

    const records = await knex('staging_entity_fragments')
      .whereIn('entity_ref', entityRefs)
      .select();
    
    expect(records).toHaveLength(2);
    records.forEach(record => {
      expect(!!record.needs_processing).toBe(false);
    });
  });
});