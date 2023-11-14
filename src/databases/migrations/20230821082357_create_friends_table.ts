import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('friends', table => {
    table.charset('utf8mb4');
    table.bigIncrements('id').unsigned().primary();

    table.bigInteger('userId').unsigned().index().references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.bigInteger('friendId').unsigned().index().references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.bigInteger('friendshipStatusId').unsigned().index().references('id').inTable('friendship_statuses').onDelete('CASCADE').notNullable();

    table.timestamp('acceptedAt').nullable();
    table.timestamp('rejectedAt').nullable();

    table.integer('snapSyncStreak').defaultTo(0)
    table.timestamp('lastSnapSync').nullable();

    table.string('friendshipHash').notNullable();

    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable().defaultTo(null);
  });

  await knex.schema.raw(`
    ALTER TABLE friends
    ADD COLUMN unarchived BOOLEAN GENERATED ALWAYS AS (IF(deletedAt IS NULL, 1, NULL)) VIRTUAL
  `);

  // Crea il trigger per calcolare e aggiornare il valore di friendshipHash
  await knex.schema.raw(`
    CREATE TRIGGER trg_friends_before_insert_update
    BEFORE INSERT ON friends
    FOR EACH ROW
    BEGIN
        SET NEW.friendshipHash = CONCAT(
            LEAST(NEW.userId, NEW.friendId),
            '_',
            GREATEST(NEW.userId, NEW.friendId)
        );
    END
  `);

  // Crea un indice univoco sulla colonna friendshipHash e unarchived
  await knex.schema.raw(`
    CREATE UNIQUE INDEX f_friendshipHash_uindex
    ON friends (friendshipHash, unarchived)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('friends');
}
