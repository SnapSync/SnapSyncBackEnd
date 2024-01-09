import { Model, ModelObject } from 'objection';
import { VexoToken } from '@/interfaces/vexo_tokens.interface';

export class VexoTokens extends Model implements VexoToken {
  id!: number;
  userId!: number;
  token!: string;

  createdAt!: Date;
  updatedAt!: Date;

  static tableName = 'vexo_tokens';
  static idColumn = 'id';
}

export type VexoTokensShape = ModelObject<VexoTokens>;
