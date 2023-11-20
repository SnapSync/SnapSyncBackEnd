import { Model, ModelObject } from 'objection';
import { AuthToken } from '@/interfaces/auth_tokens.interface';

export class AuthTokens extends Model implements AuthToken {
  id!: number;
  userId!: number;
  deviceId!: number;
  userDeviceId!: number;
  selector!: string;
  hashedValidator!: string;
  lastUsedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;

  static tableName = 'auth_tokens';
  static idColumn = 'id';
}

export type AuthTokensShape = ModelObject<AuthTokens>;
