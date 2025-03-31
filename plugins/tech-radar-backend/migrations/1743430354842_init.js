/** @typedef {import('knex').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('entries', table => {
    table.comment(
      'The table for tech radar entries'
    );
    table.uuid('entry_id').primary().defaultTo(knex.raw('uuid_generate_v4()')).comment('UUID entry ID');
    table.string('title').notNullable().comment('The title of the entry');
    table.text('description').comment('A longer description of the entry');
    table.string('url').comment('A relevant URL for the entry');
    table.string('quadrant_name').notNullable().comment('The quadrant the entry belongs to (e.g., Techniques, Tools)');
    table.string('disposition_name').notNullable().comment('The disposition or ring (e.g., Adopt, Trial, Assess, Hold)');
    table.timestamp('date').defaultTo(knex.fn.now()).comment('The date the entry was added or last updated');
  });
};

/**
 * @param {Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('entries');
};