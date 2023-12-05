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

export interface IFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface RequestWithUser extends Request {
  user: User;
}

export interface LogInResponse {
  userId: number;
  tokenData: TokenData;
  accessToken: string; // selector:validator
}
