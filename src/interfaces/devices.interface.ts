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

export type DeviceType = 'UNKNOWN' | 'PHONE' | 'TABLET' | 'TV' | 'DESKTOP';
export type PlatformOs = 'UNKNOWN' | 'android' | 'ios' | 'windows' | 'macos' | 'web';
