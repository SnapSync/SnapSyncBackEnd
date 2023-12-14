import { Model, ModelObject, Pojo } from 'objection';
import { User } from '@interfaces/users.interface';
import objectionSoftDelete from 'objection-js-soft-delete';
import { boolean } from 'boolean';

const softDelete = objectionSoftDelete({
  columnName: 'deletedAt',
  deletedValue: new Date(),
  notDeletedValue: null,
});

export class Users extends softDelete(Model) implements User {
  id!: number;
  username!: string;
  fullname!: string;

  profilePictureUrl!: string | null;
  profilePictureBlurHash!: string | null;
  profilePictureWidth!: number | null;
  profilePictureHeight!: number | null;

  phoneNumber!: string; // In formato internazionale, esempio: +393401234567

  dateOfBirth!: Date; // Data di nascita
  zodiacSignSymbol!: string; // Simbolo dello zodiaco, esempio: ♈
  zodiacSignName!: string; // Nome dello zodiaco, esempio: Ariete

  biography!: string | null;

  isVerified!: boolean;
  verifiedAt!: Date | null;

  isBanned!: boolean;
  bannedAt!: Date | null;
  bannedUntil!: Date | null;

  isShadowBanned!: boolean;
  shadowBannedAt!: Date | null;
  shadowBannedUntil!: Date | null;

  isPrivate!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;

  unarchived!: boolean;

  static tableName = 'users';
  static idColumn = 'id';

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json);

    delete json.profilePictureUrl;
    delete json.profilePictureWidth;
    delete json.profilePictureHeight;

    delete json.phoneNumber;

    // delete json.dateOfBirth;

    json.isVerified = boolean(json.isVerified);
    delete json.verifiedAt;

    delete json.latitude;
    delete json.longitude;

    delete json.isBanned;
    delete json.bannedAt;
    delete json.bannedUntil;

    delete json.isShadowBanned;
    delete json.shadowBannedAt;
    delete json.shadowBannedUntil;

    json.isPrivate = boolean(json.isPrivate);

    delete json.createdAt;
    delete json.updatedAt;
    delete json.deletedAt;

    delete json.unarchived;

    return json;
  }
}

export type UsersShape = ModelObject<Users>;
