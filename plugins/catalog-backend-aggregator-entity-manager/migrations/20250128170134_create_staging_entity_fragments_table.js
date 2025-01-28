/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('staging_entity_fragments', table => {
      table.string('provider_id').notNullable();
      table.string('entity_ref').notNullable();
      table.string('kind').notNullable();
      table.text('entity_json').notNullable();
      table.integer('priority').notNullable();
      table.timestamp('expires_at').nullable();
      table.string('content_hash').notNullable();
      table.boolean('needs_processing').notNullable().defaultTo(true);
  
      table.primary(['provider_id', 'entity_ref']);
    });
  };
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('staging_entity_fragments');
};