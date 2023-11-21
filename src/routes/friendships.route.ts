import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import FriendshipsController from '@/controllers/friendships.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class FriendshipsRoute implements Routes {
  public path = '/friendships';
  public router = Router();
  public friendshipsController = new FriendshipsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.get(`${this.path}/friends`, authMiddleware, this.friendshipsController.getUserFriends);
    // this.router.get(`${this.path}/:userId/mutual_friends`, authMiddleware, this.friendshipsController.getMutualFriends);

    this.router.post(`${this.path}/create/:userId`, authMiddleware, this.friendshipsController.createFriendship);
    this.router.post(`${this.path}/accept/:userId`, authMiddleware, this.friendshipsController.acceptFriendship);
    this.router.post(`${this.path}/reject/:userId`, authMiddleware, this.friendshipsController.rejectFriendship);
    // this.router.post(`${this.path}/destroy/:userId`, authMiddleware, this.friendshipsController.destroyFriendship);
  }
}

export default FriendshipsRoute;
