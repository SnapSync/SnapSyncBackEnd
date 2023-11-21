import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import BlockedUserService from '@/services/blocked_users.service';
import FriendService from '@/services/friends.service';
import UserService from '@/services/users.service';
import { NextFunction, Response } from 'express';

class FriendshipsController {
  public friendService = new FriendService();
  public userService = new UserService();
  public blockedUserService = new BlockedUserService();

  // public getUserFriends = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
  //   try {
  //     const pagination = retrivePaginationParamFromRequest(req);

  //     // Calcolo il limit e l'offset
  //     const limit = pagination.size;
  //     const offset = (pagination.page - 1) * pagination.size;

  //     const r = await this.friendService.findFriendsByUserId(req.user.id, req.user.id, undefined, limit, offset);

  //     res.status(200).json({ ...r });
  //   } catch (error) {
  //     nex(error);
  //   }
  // };

  // public getMutualFriends = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
  //   try {
  //     if (!req.params.userId) throw new HttpException(400, 'Missing userId parameter');
  //     if (isNaN(parseInt(req.params.userId))) throw new HttpException(400, 'User id is not a number');

  //     const userId = parseInt(req.params.userId);
  //     // Controllo se req.params.userId esiste
  //     const findUser = await this.userService.findUserById(userId);
  //     if (!findUser) throw new HttpException(404, 'User not found');

  //     if (findUser.id === req.user.id) throw new HttpException(400, 'Ops! You cannot see your mutual friends');

  //     // Controllo che req.user.id non sia bloccato da req.params.userId
  //     const isLoggedUser = await this.blockedUserService.isBlockedByUser(userId, req.user.id);
  //     if (isLoggedUser) throw new HttpException(404, 'User not found');

  //     const pagination = retrivePaginationParamFromRequest(req);

  //     // Calcolo il limit e l'offset
  //     const limit = pagination.size;
  //     const offset = (pagination.page - 1) * pagination.size;

  //     const r = await this.friendService.findMutualFriendsByUserId(findUser.id, req.user.id, undefined, limit, offset);

  //     res.status(200).json({ ...r });
  //   } catch (error) {
  //     nex(error);
  //   }
  // };

  public createFriendship = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);

      if (findUser.id === req.user.id) throw new SnapSyncException(400, 'Bad request');

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlocked = await this.blockedUserService.isBlockedByUser(findUser.id, req.user.id);
      if (isLoggedUserBlocked) throw new SnapSyncException(404, 'Not found');

      // Controllo che req.params.userId non sia bloccato da req.user.id
      const isUserBlocked = await this.blockedUserService.isBlockedByUser(req.user.id, findUser.id);
      if (isUserBlocked) throw new SnapSyncException(400, 'Bad request');

      const fs = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);
      if (fs.isFriend) throw new SnapSyncException(400, 'Bad request'); // Se sono già amici
      if (fs.outgoingRequest) throw new SnapSyncException(400, 'Bad request'); // Se ho già inviato una richiesta
      if (fs.incomingRequest) throw new SnapSyncException(400, 'Bad request'); // Se ho già ricevuto una richiesta

      await this.friendService.createFriendship(findUser.id, req.user.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json({ status: updatedFriendshipStatus, message: 'ok' });
    } catch (error) {
      nex(error);
    }
  };

  public acceptFriendship = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);

      if (findUser.id === req.user.id) throw new SnapSyncException(400, 'Bad request');

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlocked = await this.blockedUserService.isBlockedByUser(findUser.id, req.user.id);
      if (isLoggedUserBlocked) throw new SnapSyncException(404, 'Not found');

      // Controllo che req.params.userId non sia bloccato da req.user.id
      const isUserBlocked = await this.blockedUserService.isBlockedByUser(req.user.id, findUser.id);
      if (isUserBlocked) throw new SnapSyncException(400, 'Bad request');

      const fs = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);
      if (!fs.incomingRequest) throw new SnapSyncException(400, 'Bad request'); // Se non ho ricevuto una richiesta

      await this.friendService.acceptFriendship(findUser.id, req.user.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json({ status: updatedFriendshipStatus, message: 'ok' });
    } catch (error) {
      nex(error);
    }
  };

  public rejectFriendship = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);

      if (findUser.id === req.user.id) throw new SnapSyncException(400, 'Bad request');

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlocked = await this.blockedUserService.isBlockedByUser(findUser.id, req.user.id);
      if (isLoggedUserBlocked) throw new SnapSyncException(404, 'Not found');

      // Controllo che req.params.userId non sia bloccato da req.user.id
      const isUserBlocked = await this.blockedUserService.isBlockedByUser(req.user.id, findUser.id);
      if (isUserBlocked) throw new SnapSyncException(400, 'Bad request');

      const fs = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);
      if (!fs.incomingRequest) throw new SnapSyncException(400, 'Bad request'); // Se non ho ricevuto una richiesta

      await this.friendService.rejectFriendship(findUser.id, req.user.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json({ status: updatedFriendshipStatus, message: 'ok' });
    } catch (error) {
      nex(error);
    }
  };

  public destroyFriendship = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      throw new SnapSyncException(405, 'Not implemented');
    } catch (error) {
      nex(error);
    }
  };
}

export default FriendshipsController;
