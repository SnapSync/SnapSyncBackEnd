import { Request } from 'express';
import { User } from '@interfaces/users.interface';
import { Device } from './devices.interface';

export interface DataStoredInToken {
  id: number;
}

export interface TokenData {
  token: string;
  expiresIn: number;
  refreshToken: string;
}

export interface RequestWithClientIp extends Request {
  clientIp: string;
}

export interface RequestWithUser extends RequestWithClientIp {
  user: User;
}

export interface RequestWithDevice extends RequestWithClientIp {
  device: Device | null;
}

export interface LogInResponse {
  deviceUuid: string;
  tokenData: TokenData;
}