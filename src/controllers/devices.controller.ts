import { CreateDeviceDto } from '@/dtos/devices.dto';
import DeviceService from '@/services/devices.service';
import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';

class DevicesController {
  public deviceService = new DeviceService();

  public registerDevice = async (req: Request, res: Response, next: NextFunction) => {
    // Check if platformOd is 'ios' or 'android'
    const validationSchema = yup.object().shape({
      platformOs: yup.string().required().oneOf(['ios', 'android']),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const data: CreateDeviceDto = req.body;

      const createdDevice = await this.deviceService.createDevice(data);

      res.status(201).json({ message: 'ok', device: createdDevice });
    } catch (error) {
      next(error);
    }
  };
}

export default DevicesController;
