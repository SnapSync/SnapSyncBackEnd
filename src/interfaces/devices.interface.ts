import DeviceType from '@/types/device_type.type';
import PlatformOs from '@/types/platform_os.type';

export interface Device {
  id: number;
  uuid: string;

  platformOs: PlatformOs;
  deviceType: DeviceType;

  brand: string | null;
  osName: string | null;
  osVersion: string | null;
  modelName: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  unarchived: boolean;
}
