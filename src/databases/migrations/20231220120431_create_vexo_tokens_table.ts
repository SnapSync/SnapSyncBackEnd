import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('vexo_tokens', table => {
    table.bigIncrements('id').unsigned().primary();
    table.bigInteger('userId').unsigned().index().references('id').inTable('users').onDelete('CASCADE').notNullable().unique();
    table.string('token').notNullable();

    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('vexo_tokens');
}
