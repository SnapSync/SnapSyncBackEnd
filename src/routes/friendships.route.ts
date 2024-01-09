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
    this.router.get(`${this.path}/friends`, authMiddleware, this.friendshipsController.getUserFriends);
    this.router.get(`${this.path}/friends/count`, authMiddleware, this.friendshipsController.getUserFriendsCount);
    this.router.get(`${this.path}/mutual_friends/:userId`, authMiddleware, this.friendshipsController.getMutualFriends);
    this.router.get(`${this.path}/suggestions`, authMiddleware, this.friendshipsController.getSuggestions);

    this.router.get(`${this.path}/friend-requests/received`, authMiddleware, this.friendshipsController.getReceivedFriendRequests);
    this.router.get(`${this.path}/friend-requests/sent`, authMiddleware, this.friendshipsController.getSentFriendRequests);

    this.router.get(`${this.path}/friend-requests/received/count`, authMiddleware, this.friendshipsController.getReceivedFriendRequestsCount);
    this.router.get(`${this.path}/friend-requests/sent/count`, authMiddleware, this.friendshipsController.getSentFriendRequestsCount);

    this.router.get(`${this.path}/show/:userId`, authMiddleware, this.friendshipsController.showFriendship);

    this.router.post(`${this.path}/create/:userId`, authMiddleware, this.friendshipsController.createFriendship);
    this.router.post(`${this.path}/accept/:userId`, authMiddleware, this.friendshipsController.acceptFriendship);
    this.router.post(`${this.path}/reject/:userId`, authMiddleware, this.friendshipsController.rejectFriendship);
    this.router.post(`${this.path}/destroy/:userId`, authMiddleware, this.friendshipsController.destroyFriendship);

    this.router.post(`${this.path}/block/:userId`, authMiddleware, this.friendshipsController.blockUser);
    this.router.post(`${this.path}/unblock/:userId`, authMiddleware, this.friendshipsController.unblockUser);
  }
}

export default FriendshipsRoute;
