import { Router } from 'express';
import UsersController from '@controllers/users.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';

class UsersRoute implements Routes {
  public path = '/users';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/me`, authMiddleware, this.usersController.getMe);
    // this.router.get(`${this.path}/:userId(\\d+)`, authMiddleware, this.usersController.getUserById);
    // this.router.delete(`${this.path}/:id(\\d+)`, this.usersController.deleteUser);
  }
}

export default UsersRoute;
