import {
  DatabaseService,
} from '@backstage/backend-plugin-api';
import {
  TestDatabases,
  TestDatabaseId,
} from '@backstage/backend-test-utils';
import { Knex } from 'knex';
import { EntriesRepository, TechRadarEntry } from './entriesRepository';

describe('EntriesRepository', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_16', 'SQLITE_3'],
  });

  async function createRepo(
    databaseId: TestDatabaseId,
  ): Promise<{ repo: EntriesRepository; knex: Knex }> {
    const knex = await databases.init(databaseId);
    const databaseService: DatabaseService = {
      getClient: async () => knex,
    };
    const repo = await EntriesRepository.create(databaseService);
    return { repo, knex };
  }

  const sampleEntries: TechRadarEntry[] = [
    {
      entry_id: 'entry1',
      title: 'Entry One',
      quadrant_name: 'Techniques',
      disposition_name: 'Adopt',
      description: 'First description',
      date: new Date('2023-01-15T00:00:00.000Z'),
      url: 'http://example.com/1',
    },
    {
      entry_id: 'entry2',
      title: 'Entry Two',
      quadrant_name: 'Tools',
      disposition_name: 'Trial',
      date: new Date('2023-02-20T00:00:00.000Z'),
      url: 'http://example.com/2',
    },
    {
        entry_id: 'entry3',
        title: 'Entry Three',
        quadrant_name: 'Platforms',
        disposition_name: 'Assess',
    }
  ];

  const TABLE_NAME = 'entries';

  it.each(databases.eachSupportedId())(
    'should insert entries correctly [%s]',
    async databaseId => {
      const { repo, knex } = await createRepo(databaseId);
      await repo.updateAll(sampleEntries);

      const dbRows = await knex(TABLE_NAME).select().orderBy('entry_id');

      expect(dbRows).toHaveLength(3);
      expect(dbRows[0].entry_id).toBe('entry1');
      expect(dbRows[1].entry_id).toBe('entry2');
      expect(dbRows[2].entry_id).toBe('entry3');
      expect(dbRows[1].description).toBeNull();
      expect(dbRows[2].date).toBeNull();
    },
  );

   it.each(databases.eachSupportedId())(
    'should replace existing entries on updateAll [%s]',
    async databaseId => {
      const { repo, knex } = await createRepo(databaseId);

      await repo.updateAll([sampleEntries[0]]);
      let dbRows = await knex(TABLE_NAME).select();
      expect(dbRows).toHaveLength(1);

      const newEntries = [sampleEntries[1], sampleEntries[2]];
      await repo.updateAll(newEntries);

      dbRows = await knex(TABLE_NAME).select().orderBy('entry_id');
      expect(dbRows).toHaveLength(2);
      expect(dbRows.map(r => r.entry_id)).toEqual(['entry2', 'entry3']);
    },
   );


  it.each(databases.eachSupportedId())(
    'should get all entries correctly [%s]',
    async databaseId => {
      const { repo } = await createRepo(databaseId);
      await repo.updateAll(sampleEntries);
      const retrievedEntries = await repo.getAllEntries();

      const sortedExpectedIds = sampleEntries.map(e => e.entry_id).sort();
      const sortedRetrievedIds = retrievedEntries.map(e => e.entry_id).sort();

      expect(retrievedEntries).toHaveLength(sampleEntries.length);
      expect(sortedRetrievedIds).toEqual(sortedExpectedIds);

      const entry1Retrieved = retrievedEntries.find(e => e.entry_id === 'entry1');
      expect(entry1Retrieved?.title).toBe('Entry One');
      expect(entry1Retrieved?.date?.toISOString()).toBe(sampleEntries[0].date?.toISOString());

      const entry3Retrieved = retrievedEntries.find(e => e.entry_id === 'entry3');
      expect(entry3Retrieved?.title).toBe('Entry Three');
      expect(entry3Retrieved?.description).toBeNull();
      expect(entry3Retrieved?.url).toBeNull();
      expect(entry3Retrieved?.date).toBeInstanceOf(Date);

    },
  );

  it.each(databases.eachSupportedId())(
    'should return empty array when getting entries from empty table [%s]',
    async databaseId => {
      const { repo } = await createRepo(databaseId);
      const retrievedEntries = await repo.getAllEntries();
      expect(retrievedEntries).toEqual([]);
    },
  );

}); 