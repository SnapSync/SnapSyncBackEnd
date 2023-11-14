import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import BlockedUserService from '@/services/blocked_users.service';
import FriendService from '@/services/friends.service';
import UserService from '@/services/users.service';
import { retrivePaginationParamFromRequest } from '@/utils/util';
import { NextFunction, Response } from 'express';

class FriendshipsController {
  public friendService = new FriendService();
  public userService = new UserService();
  public blockedUserService = new BlockedUserService();

  public getUserFriends = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      const pagination = retrivePaginationParamFromRequest(req);

      // Calcolo il limit e l'offset
      const limit = pagination.size;
      const offset = (pagination.page - 1) * pagination.size;

      const r = await this.friendService.findFriendsByUserId(req.user.id, req.user.id, undefined, limit, offset);

      res.status(200).json({ ...r });
    } catch (error) {
      nex(error);
    }
  };

  public getMutualFriends = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new HttpException(400, 'Missing userId parameter');
      if (isNaN(parseInt(req.params.userId))) throw new HttpException(400, 'User id is not a number');

      const userId = parseInt(req.params.userId);
      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);
      if (!findUser) throw new HttpException(404, 'User not found');

      if (findUser.id === req.user.id) throw new HttpException(400, 'Ops! You cannot see your mutual friends');

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUser = await this.blockedUserService.isBlockedByUser(userId, req.user.id);
      if (isLoggedUser) throw new HttpException(404, 'User not found');

      const pagination = retrivePaginationParamFromRequest(req);

      // Calcolo il limit e l'offset
      const limit = pagination.size;
      const offset = (pagination.page - 1) * pagination.size;

      const r = await this.friendService.findMutualFriendsByUserId(findUser.id, req.user.id, undefined, limit, offset);

      res.status(200).json({ ...r });
    } catch (error) {
      nex(error);
    }
  };
}

export default FriendshipsController;
