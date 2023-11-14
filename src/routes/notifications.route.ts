import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import NotificationsController from '@/controllers/notifications.controller';

class NotificationsRoute implements Routes {
  public path = '/notifications';
  public router = Router();
  public notificationsController = new NotificationsController();


  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
  }
}

export default NotificationsRoute;
