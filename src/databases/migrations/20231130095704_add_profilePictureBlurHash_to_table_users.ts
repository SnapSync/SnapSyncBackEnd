import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', table => {
    table.string('profilePictureBlurHash', 255).nullable().after('profilePictureUrl');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', table => {
    table.dropColumn('profilePictureBlurHash');
  });
}
