import { NextFunction, Response } from 'express';
import UserService from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import BlockedUserService from '@/services/blocked_users.service';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import moment from 'moment';

class UsersController {
  public userService = new UserService();
  public blockedUserService = new BlockedUserService();

  public getUsers = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.findAllUsers();

      res.status(200).json({ data: users, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const apiUser = await this.userService.findApiUserById(req.user.id);

      res.status(200).json({ result: apiUser, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public getMeCreatedAt = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const createdAt = req.user.createdAt;
      // Transformo createdAt in numero di secondi
      const createdAtInSeconds = moment(createdAt).unix();

      res.status(200).json({ joinedAt: createdAtInSeconds, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad Request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad Request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const user = await this.userService.findUserById(userId);
      if (!user) throw new SnapSyncException(404, 'Not Found');

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlockedByUser = await this.blockedUserService.isBlockedByUser(user.id, req.user.id);
      if (isLoggedUserBlockedByUser) throw new SnapSyncException(404, 'Not Found');

      const up = await this.userService.findUserProfileById(userId, req.user.id);

      res.status(200).json({ result: up, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
