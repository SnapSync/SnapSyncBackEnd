import { NextFunction, Response } from 'express';
import UserService from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import BlockedUserService from '@/services/blocked_users.service';
import { SnapSyncException } from '@/exceptions/SnapSyncException';

class UsersController {
  public userService = new UserService();
  public blockedUserService = new BlockedUserService();

  public getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const apiUser = await this.userService.findApiUserById(req.user.id);

      res.status(200).json({ ...apiUser, message: 'ok' });
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

      res.status(200).json({ ...up, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
