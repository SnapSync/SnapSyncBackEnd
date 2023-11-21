import DeviceType from '@/types/device_type.type';
import PlatformOs from '@/types/platform_os.type';

export class CreateDeviceDto {
  platformOs: PlatformOs;
  deviceType: DeviceType;
  brand?: string;
  osName?: string;
  osVersion?: string;
  modelName?: string;
}
