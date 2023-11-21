import { NextFunction, Response } from 'express';
import { RequestWithDevice } from '@/interfaces/auth.interface';
import { validate as uuidValidate } from 'uuid';
import { version as uuidVersion } from 'uuid';
import { Device } from '@/interfaces/devices.interface';
import { Devices } from '@/models/devices.model';
import { SnapSyncException } from '@/exceptions/SnapSyncException';

function uuidValidateV4(uuid) {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

const deviceMiddleware = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
  try {
    const deviceUuid = req.cookies['DeviceUuid'] || (req.header('DeviceUuid') ? req.header('DeviceUuid') : null);

    // Controllo se il deviceUuid è stato passato ed è valido
    if (deviceUuid && deviceUuid.length > 0 && uuidValidateV4(deviceUuid)) {
      // Provo a recuperare il device
      var device: Device | null = null;

      try {
        device = await Devices.query().whereNotDeleted().andWhere('uuid', deviceUuid).first();
      } catch (error) {
        device = null;
      }

      req.device = device;
    } else {
      req.device = null;
    }

    next();
  } catch (error) {
    next(new SnapSyncException(500, 'Internal Server Error'));
  }
};

export default deviceMiddleware;
