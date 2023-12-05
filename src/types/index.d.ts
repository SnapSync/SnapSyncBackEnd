import { IFile } from '@/interfaces/auth.interface';
import { Device } from '@/interfaces/devices.interface';

declare global {
  namespace Express {
    interface Request {
      file?: IFile;
      clientIp?: string;
    }
  }
}

export {};
