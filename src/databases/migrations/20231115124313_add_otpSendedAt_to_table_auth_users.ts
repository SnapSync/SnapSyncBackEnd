import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('auth_users', table => {
    table.timestamp('otpSendedAt').nullable().after('dateOfBirth');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('auth_users', table => {
    table.dropColumn('otpSendedAt');
  });
}
