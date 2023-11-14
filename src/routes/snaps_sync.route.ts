import SnapsSyncController from '@/controllers/snaps_sync.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';


class SnapsSyncRoute implements Routes {
  public path = '/snaps_sync';
  public router = Router();
  public snapsSyncController = new SnapsSyncController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
  }
}

export default SnapsSyncRoute;
