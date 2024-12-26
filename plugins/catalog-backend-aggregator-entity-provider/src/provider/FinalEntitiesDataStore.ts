import { DatabaseService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';

type QueryResult = {
  items: Array<{ entity_ref: string }>;
};

export class FinalEntitiesDataStore {
  private readonly db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async queryByLocation(locationPrefix: string, offset = 0, limit = 1000): Promise<QueryResult> {
    const client = await this.db.getClient();
    const knex = client as unknown as Knex;
    let query = knex('final_entities').select('entity_ref');
  
    if (knex.client.config.client === 'sqlite3') {
      query = query.whereRaw(
        "json_extract(final_entity, '$.metadata.annotations[\"backstage.io/managed-by-location\"]') LIKE ?",
        [`${locationPrefix}%`],
      );
    } else {
      query = query.whereRaw(
        "final_entity->'metadata'->'annotations'->>'backstage.io/managed-by-location' LIKE ?",
        [`${locationPrefix}%`],
      );
    }
  
    const rows = await query
      .offset(offset)
      .limit(limit);
  
    return { items: rows };
  }
}