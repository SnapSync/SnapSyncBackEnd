import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('devices', table => {
    table.charset('utf8mb4');

    table.bigIncrements('id').unsigned().primary();
    table.uuid('uuid').notNullable();

    table.enum('platformOs', ['UNKNOWN', 'ios', 'android', 'windows', 'macos', 'web']).defaultTo('UNKNOWN'); // https://reactnative.dev/docs/platform#os
    table.enum('deviceType', ['UNKNOWN', 'PHONE', 'TABLET', 'TV', 'DESKTOP']).defaultTo('UNKNOWN'); // https://docs.expo.dev/versions/latest/sdk/device/#devicedevicetype

    table.string('brand').nullable();
    table.string('osName').nullable();
    table.string('osVersion').nullable();
    table.string('modelName').nullable();

    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable().defaultTo(null);
  });

  await knex.schema.raw(`
    ALTER TABLE devices
    ADD COLUMN unarchived BOOLEAN GENERATED ALWAYS AS (IF(deletedAt IS NULL, 1, NULL)) VIRTUAL
  `);

  // UNIQUE KEY (uuid, unarchived)
  await knex.schema.raw(`
    CREATE UNIQUE INDEX d_uuid_unarchived_uindex
    ON devices (uuid, unarchived)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('devices');
}
