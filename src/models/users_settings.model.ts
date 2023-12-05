import { Model, ModelObject } from 'objection';
import { UserSetting } from '@/interfaces/users_settings.interface';

export class UsersSettings extends Model implements UserSetting {
  id!: number;
  userId!: number;
  syncContacts!: boolean;

  createdAt!: Date;
  updatedAt!: Date;

  static tableName = 'users_settings';
  static idColumn = 'id';
}

export type UsersSettingsShape = ModelObject<UsersSettings>;
