import { Model, ModelObject, Pojo } from 'objection';
import objectionSoftDelete from 'objection-js-soft-delete';
import { Device } from '@/interfaces/devices.interface';

const softDelete = objectionSoftDelete({
  columnName: 'deletedAt',
  deletedValue: new Date(),
  notDeletedValue: null,
});

export class Devices extends softDelete(Model) implements Device {
  id!: number;
  uuid!: string;
  brand!: string | null;
  osName!: string | null;
  osVersion!: string | null;
  modelName!: string | null;
  platformOs!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;

  unarchived!: boolean;

  static tableName = 'devices'; // database table name
  static idColumn = 'id'; // id column name

  $formatJson(json: Pojo): Pojo {
    json = super.$formatJson(json);

    delete json.createdAt;
    delete json.updatedAt;
    delete json.deletedAt;

    delete json.unarchived;

    return json;
  }
}

export type DevicesShape = ModelObject<Devices>;
