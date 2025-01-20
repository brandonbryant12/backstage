import { mockServices, TestDatabases } from '@backstage/backend-test-utils';
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { StagingEntitiesStore } from './StagingEntitiesStore';

describe('StagingEntitiesStore', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_16', 'SQLITE_3'],
  });

  let logger: LoggerService;

  beforeEach(() => {
    logger = mockServices.logger.mock();
  });

  it.each(databases.eachSupportedId())('initializes table if needed (%s)', async databaseId => {
    const knex = await databases.init(databaseId);
    const database: DatabaseService = {
      getClient: async () => knex,
    };
    const store = await StagingEntitiesStore.create(database, logger);

    // We'll just check existence
    const hasTable = await knex.schema.hasTable('staging_entities');
    expect(hasTable).toBe(true);
    expect(store).toBeTruthy();
  });

  it.each(databases.eachSupportedId())('upsert and retrieve records (%s)', async databaseId => {
    const knex = await databases.init(databaseId);
    const database: DatabaseService = {
      getClient: async () => knex,
    };
    const store = await StagingEntitiesStore.create(database, logger);

    await store.upsertMultiple('providerA', [
      {
        entityRef: 'component:default/foo',
        entityJson: { apiVersion: 'v1', kind: 'Component', metadata: { name: 'foo' } },
      },
      {
        entityRef: 'component:default/bar',
        entityJson: { apiVersion: 'v1', kind: 'Component', metadata: { name: 'bar' } },
      },
    ], 100, 60);

    const records = await store.getRecords();
    expect(records.length).toBe(2);
    expect(records[0].has_delta).toBe(true);
  });

  it.each(databases.eachSupportedId())('markProcessed sets has_delta=false (%s)', async databaseId => {
    const knex = await databases.init(databaseId);
    const database: DatabaseService = {
      getClient: async () => knex,
    };
    const store = await StagingEntitiesStore.create(database, logger);

    await store.upsertMultiple('providerA', [
      {
        entityRef: 'component:default/test',
        entityJson: { foo: 'bar' },
      },
    ], 99);

    const recsBefore = await store.getRecords();
    expect(recsBefore[0].has_delta).toBe(true);

    await store.markProcessed(['component:default/test']);
    const recsAfter = await store.getRecords();
    expect(recsAfter[0].has_delta).toBe(false);
  });

  it.each(databases.eachSupportedId())('removeRecords deletes them (%s)', async databaseId => {
    const knex = await databases.init(databaseId);
    const database: DatabaseService = {
      getClient: async () => knex,
    };
    const store = await StagingEntitiesStore.create(database, logger);

    await store.upsertMultiple('providerA', [
      { entityRef: 'component:default/testA', entityJson: { a: 1 } },
      { entityRef: 'component:default/testB', entityJson: { b: 2 } },
    ], 50);

    await store.removeRecords(['component:default/testA']);
    const all = await store.getRecords();
    expect(all.length).toBe(1);
    expect(all[0].entity_ref).toBe('component:default/testb');
  });

  it.each(databases.eachSupportedId())('mergeRecords logic merges in priority desc (%s)', async databaseId => {
    const knex = await databases.init(databaseId);
    const database: DatabaseService = {
      getClient: async () => knex,
    };
    const store = await StagingEntitiesStore.create(database, logger);

    await store.upsertMultiple('providerA', [
      { entityRef: 'component:default/xyz', entityJson: { metadata: { name: 'xyz', annotations: { a: 'fromA' }}, spec: { arr: ['a'], foo: 1 } } },
    ], 100);
    await store.upsertMultiple('providerB', [
      { entityRef: 'component:default/xyz', entityJson: { metadata: { name: 'xyz', annotations: { b: 'fromB' }}, spec: { arr: ['b'], bar: 2 } } },
    ], 50);

    const merged = await store.mergeRecords('component:default/xyz');
    expect(merged.metadata.name).toBe('xyz');
    // 'a' from 'providerA' has higher priority, so it doesn't get overwritten
    expect(merged.metadata.annotations.a).toBe('fromA');
    // 'b' from 'providerB' merges in
    expect(merged.metadata.annotations.b).toBe('fromB');
    // arr unions
    expect(merged.spec.arr).toEqual(['a', 'b']);
    // keep both foo=1 and bar=2
    expect(merged.spec.foo).toBe(1);
    expect(merged.spec.bar).toBe(2);
  });

  it.each(databases.eachSupportedId())('purgeExpired removes old rows (%s)', async databaseId => {
    const knex = await databases.init(databaseId);
    const database: DatabaseService = {
      getClient: async () => knex,
    };
    const store = await StagingEntitiesStore.create(database, logger);

    // upsert with small TTL
    await store.upsertMultiple('providerA', [
      { entityRef: 'component:default/will-expire', entityJson: { name: 'expire me' } },
    ], 10, 1);

    // Wait 2 seconds
    await new Promise(res => setTimeout(res, 2000));

    const removedCount = await store.purgeExpired();
    expect(removedCount).toBe(1);

    const all = await store.getRecords();
    expect(all.length).toBe(0);
  });

});