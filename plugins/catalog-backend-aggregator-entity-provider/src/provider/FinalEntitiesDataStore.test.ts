import { mockServices, TestDatabases } from '@backstage/backend-test-utils';
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { FinalEntitiesDataStore } from './FinalEntitiesDataStore';

describe('FinalEntitiesDataStore', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_16', 'SQLITE_3'],
  });

  async function createStore(databaseId: string) {
    const knex = await databases.init(databaseId);
    const logger: LoggerService = mockServices.logger.mock();
    const database: DatabaseService = {
      getClient: async () => knex,
    };

    // Create table if it doesn't exist
    if (!(await knex.schema.hasTable('final_entities'))) {
      await knex.schema.createTable('final_entities', table => {
        table.string('entity_ref');
        if (knex.client.config.client === 'pg') {
          table.jsonb('final_entity');
        } else {
          table.json('final_entity');
        }
      });
    }

    return {
      store: new FinalEntitiesDataStore(database),
      knex: knex as Knex,
      logger,
    };
  }

  it.each(databases.eachSupportedId())('should query by location prefix', async databaseId => {
    const { store, knex } = await createStore(databaseId);
    // Insert test data
    await knex('final_entities').insert([
      {
        entity_ref: 'component:default/test1',
        final_entity: JSON.stringify({
          metadata: {
            annotations: {
              'backstage.io/managed-by-location': 'entityAggregator://test1',
            },
          },
        }),
      },
      {
        entity_ref: 'component:default/test2',
        final_entity: JSON.stringify({
          metadata: {
            annotations: {
              'backstage.io/managed-by-location': 'entityAggregator://test2',
            },
          },
        }),
      },
      {
        entity_ref: 'component:default/other',
        final_entity: JSON.stringify({
          metadata: {
            annotations: {
              'backstage.io/managed-by-location': 'otherSource://another',
            },
          },
        }),
      },
    ]);

    const result = await store.queryByLocation('entityAggregator://test');
    expect(result.items).toHaveLength(2);
    const sortedRefs = result.items.map(r => r.entity_ref).sort();
    expect(sortedRefs).toEqual([
      'component:default/test1',
      'component:default/test2',
    ]);
  });
});