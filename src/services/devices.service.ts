import { CreateDeviceDto } from '@/dtos/devices.dto';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { Device } from '@/interfaces/devices.interface';
import { Devices } from '@/models/devices.model';
import { v4 as uuidv4 } from 'uuid';

class DeviceService {
  public async createDevice(data: CreateDeviceDto): Promise<Device> {
    const uuid = uuidv4();

    // Controllo se esiste già un device con lo stesso uuid, non dovrebbe mai succedere, ma se succede ritorno l'errore
    const findDevice: Device = await Devices.query().whereNotDeleted().findOne({ uuid: uuid });
    if (findDevice) throw new SnapSyncException(409, 'Conflict');

    const createdDevice: Device = await Devices.query().insert({
      uuid: uuid,
      brand: data.brand,
      osName: data.osName,
      osVersion: data.osVersion,
      modelName: data.modelName,
      platformOs: data.platformOs,
    });

    return createdDevice;
  }
}

export default DeviceService;
