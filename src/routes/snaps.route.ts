import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import SnapsController from '@/controllers/snaps.controller';

class AccountsRoute implements Routes {
  public path = '/snaps';
  public router = Router();
  public snapsController = new SnapsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/count`, authMiddleware, this.snapsController.getSnapsCount);
  }
}

export default AccountsRoute;
