import { NextFunction, Request, Response } from 'express';
import { User, UserProfile } from '@interfaces/users.interface';
import UserService from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { HttpException } from '@/exceptions/HttpException';
import BlockedUserService from '@/services/blocked_users.service';

class UsersController {
  public userService = new UserService();
  public blockedUserService = new BlockedUserService();

  public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findAllUsersData: User[] = await this.userService.findAllUser();

      res.status(200).json({ ...findAllUsersData });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const apiUser = await this.userService.findApiUserById(req.user.id);

      res.status(200).json({ ...apiUser, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  // public getUserById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  //   try {
  //     if (!req.params.userId) throw new HttpException(400, 'User id not set');
  //     if (isNaN(parseInt(req.params.userId))) throw new HttpException(400, 'User id is not a number');

  //     // Controllo se req.params.userId esiste
  //     const userId = parseInt(req.params.userId);
  //     const user = await this.userService.findUserById(userId);
  //     if (!user) throw new HttpException(404, 'User not found');

  //     // Controllo che req.user.id non sia bloccato da req.params.userId
  //     const isLoggedUser = await this.blockedUserService.isBlockedByUser(userId, req.user.id);
  //     if (isLoggedUser) throw new HttpException(404, 'User not found');

  //     const up: UserProfile = await this.userService.findUserProfileById(userId, req.user.id);

  //     res.status(200).json({ ...up, message: 'ok' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}

export default UsersController;
