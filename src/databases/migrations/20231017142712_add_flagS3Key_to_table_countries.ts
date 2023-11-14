import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.table('countries', (table) => {
        table.string('flagS3Key').nullable().after('flagPublicId');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.table('countries', (table) => {
        table.dropColumn('flagS3Key');
    });
}

