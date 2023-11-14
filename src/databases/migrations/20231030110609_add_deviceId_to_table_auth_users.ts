import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('auth_users', table => {
    table.bigInteger('deviceId').unsigned().index().references('id').inTable('devices').onDelete('CASCADE').notNullable().after('id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('auth_users', table => {
    table.dropForeign(['deviceId']);
    table.dropColumn('deviceId');
  });
}
