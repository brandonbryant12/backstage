
// <ai_context>
// This file defines the initial database schema for the custom tech radar backend plugin.
// It creates the 'my_tech_radar_entries' table using Knex.js migrations.
// This file is now located under src/migrations.
// </ai_context>
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('my_tech_radar_entries', table => {
    table.comment('Stores Tech Radar entries');
    // Using 'key' as the primary identifier from the source data
    table.string('key').notNullable().primary().comment('Unique key for the entry');
    table.string('id').notNullable().comment('Stable ID for the entry (can be same as key initially)');
    table.string('title').notNullable().comment('Display title of the entry');
    table.string('quadrant_id').notNullable().comment('Reference to the quadrant ID (maps to entry.quadrant string)');
    // Storing the latest ring_id is technically redundant if timeline is processed correctly,
    // but can be useful for quick filtering or if the source doesn't provide full history.
    table.string('ring_id').notNullable().comment('Reference to the current ring ID (derived from latest timeline entry)');
    table.text('description').nullable().comment('Markdown description of the entry');
    // Store full timeline as JSON. Factory will parse and use this.
    table.jsonb('timeline').notNullable().comment('Timeline array as JSON (stores RadarEntrySnapshot[])');
    table.jsonb('links').nullable().comment('Links array as JSON (stores RadarEntryLink[])');
    table
      .timestamp('creation_timestamp')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the entry was first created in the DB');
    table
      .timestamp('last_updated_timestamp')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the entry was last updated');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('my_tech_radar_entries');
}
      