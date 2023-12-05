import { Model, ModelObject, Pojo } from 'objection';
import objectionSoftDelete from 'objection-js-soft-delete';
import { Friend, Status } from '@/interfaces/friends.interface';

// Specify the options for this plugin. This are the defaults.
const softDelete = objectionSoftDelete({
  columnName: 'deletedAt',
  deletedValue: new Date(),
  notDeletedValue: null,
});

export class Friends extends softDelete(Model) implements Friend {
  id!: number;
  userId!: number;
  friendId!: number;
  status!: Status;

  acceptedAt!: Date | null;
  rejectedAt!: Date | null;

  streak!: number;
  lastSnapSyncAt!: Date | null;

  friendshipHash!: string;

  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
  unarchived!: boolean;

  static tableName = 'friends';
  static idColumn = 'id';

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json);
    delete json.createdAt;
    delete json.updatedAt;
    delete json.deletedAt;
    delete json.unarchived;
    return json;
  }
}

export type FriendsShape = ModelObject<Friends>;
