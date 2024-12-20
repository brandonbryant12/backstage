import { mockServices, TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import { RawEntitiesStore } from './RawEntitiesStore';
import { LoggerService } from '@backstage/backend-plugin-api';


describe('RawEntitiesStore', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_13', 'SQLITE_3'],
  });

  async function createStore(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    const logger: LoggerService = mockServices.logger.mock();
    const database = {
      getClient: async () => knex,
    };
    
    return {
      store: await RawEntitiesStore.create(database, logger),
      knex,
      logger,
    };
  }

  it.each(databases.eachSupportedId())(
    'should upsert records, %p',
    async databaseId => {
      const { store, knex, logger } = await createStore(databaseId);
      
      const records = [{
        dataSource: 'test-source',
        entityRef: 'component:default/service-1',
        metadata: { name: 'service-1' },
        spec: {},
        priorityScore: 100,
      }];

      await store.upsertRecords(records);

      const result = await knex('entityRecords').select();
      expect(result).toHaveLength(1);
      expect(result[0].dataSource).toBe('test-source');
      expect(result[0].entityRef).toBe('component:default/service-1');
      expect(JSON.parse(result[0].metadata)).toEqual({ name: 'service-1' });
      expect(logger.debug).toHaveBeenCalledWith(
        'Processed 1 records in a single transaction',
      );
    },
  );

  it.each(databases.eachSupportedId())(
    'should get records by entityRef, %p',
    async databaseId => {
      const { store, knex } = await createStore(databaseId);

      const testRecord = {
        dataSource: 'test-source',
        entityRef: 'component:default/service-2',
        metadata: { name: 'service-2' },
        spec: {},
        priorityScore: 50,
      };

      await store.upsertRecords([testRecord]);

      const records = await store.getRecordsByEntityRef('component:default/service-2');
      expect(records).toHaveLength(1);
      expect(records[0].dataSource).toBe('test-source');
      expect(records[0].metadata).toEqual({ name: 'service-2' });
      const rawRecords = await knex('entityRecords')
        .where('entityRef', 'component:default/service-2')
        .select();
      expect(rawRecords).toHaveLength(1);
      expect(JSON.parse(rawRecords[0].metadata)).toEqual({ name: 'service-2' });
    },
  );

  it.each(databases.eachSupportedId())(
    'should remove expired records, %p',
    async databaseId => {
      const { store, knex } = await createStore(databaseId);

      const pastDate = new Date(Date.now() - 10000);
      const testRecord = {
        dataSource: 'test-source',
        entityRef: 'component:default/service-3',
        metadata: { name: 'service-3' },
        spec: {},
        priorityScore: 100,
        expirationDate: pastDate,
      };

      await store.upsertRecords([testRecord]);

      const count = await store.removeExpiredRecords();
      expect(count).toBe(1);

      const remaining = await knex('entityRecords').select();
      expect(remaining).toHaveLength(0);
    },
  );

  it.each(databases.eachSupportedId())(
    'should handle JSON fields correctly, %p',
    async databaseId => {
      const { store, knex } = await createStore(databaseId);

      const complexMetadata = {
        name: 'service-4',
        annotations: {
          'backstage.io/techdocs-ref': 'dir:.',
        },
        labels: {
          tier: 'production',
        },
      };

      const testRecord = {
        dataSource: 'test-source',
        entityRef: 'component:default/service-4',
        metadata: complexMetadata,
        spec: { type: 'service' },
        priorityScore: 100,
      };

      await store.upsertRecords([testRecord]);
      const records = await store.getRecordsByEntityRef('component:default/service-4');
      expect(records[0].metadata).toEqual(complexMetadata);

      const rawRecords = await knex('entityRecords')
        .where('entityRef', 'component:default/service-4')
        .select();
      expect(JSON.parse(rawRecords[0].metadata)).toEqual(complexMetadata);
    },
  );
});