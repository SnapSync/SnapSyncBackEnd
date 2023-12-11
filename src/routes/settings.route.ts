import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import SettingsController from '@/controllers/settings.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class SettingsRoute implements Routes {
  public path = '/settings';
  public router = Router();
  public settingsController = new SettingsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/web_info`, authMiddleware, this.settingsController.getWebInfo);
    this.router.get(`${this.path}/blocked_users`, authMiddleware, this.settingsController.getUserBlockedUsers);

    this.router.put(`${this.path}/allow_sync_contacts`, authMiddleware, this.settingsController.updateAllowSyncContacts);
  }
}

export default SettingsRoute;
