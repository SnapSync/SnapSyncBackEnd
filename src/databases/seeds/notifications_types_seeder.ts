import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("notifications_types").del();

    // Inserts seed entries
    await knex("notifications_types").insert([
        { id: 1, name: "FriendRequestReceived" },
        { id: 2, name: "FriendRequestAccepted" },
        { id: 3, name: "SnapSyncRequestReceived" },
        { id: 4, name: "SnapSyncRequestAccepted" }
    ]);
};
