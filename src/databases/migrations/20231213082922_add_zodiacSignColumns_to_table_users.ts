import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', table => {
    table.specificType('zodiacSignSymbol', 'char(1)').notNullable().after('dateOfBirth');
    table.string('zodiacSignName').notNullable().after('zodiacSignSymbol');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', table => {
    table.dropColumn('zodiacSignSymbol');
    table.dropColumn('zodiacSignName');
  });
}
