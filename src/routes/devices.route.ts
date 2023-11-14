import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import DevicesController from '@/controllers/devices.controller';

class DevicesRoute implements Routes {
  public path = '/devices';
  public router = Router();
  public devicesController = new DevicesController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, this.devicesController.registerDevice);
  }
}

export default DevicesRoute;
