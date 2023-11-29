import { CreateBlockedUserDto } from '@/dtos/blocked_users.dto';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
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
      let p = retrivePaginationParamFromRequest(req);

      // Calcolo il limit e l'offset
      const limit = p.size;
      const offset = (p.page - 1) * p.size;

      const friends = await this.friendService.findFriendsByUserId(req.user.id, undefined, limit, offset);

      // Calcolo il nextCursor/prevCursor per React-Query
      const allPages = Math.ceil(friends.total / limit);
      const nextCursor: number | undefined = allPages > p.page ? p.page + 1 : undefined;
      const prevCursor: number | undefined = p.page > 1 ? p.page - 1 : undefined;

      res.status(200).json({
        message: 'ok',
        data: friends.data,
        nextCursor: nextCursor,
        prevCursor: prevCursor,
      });
    } catch (error) {
      nex(error);
    }
  };

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

  public getReceivedFriendRequests = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      let p = retrivePaginationParamFromRequest(req);

      // Calcolo il limit e l'offset
      const limit = p.size;
      const offset = (p.page - 1) * p.size;

      const friendRequests = await this.friendService.findReceivedFriendRequestsByUserId(req.user.id, undefined, limit, offset);

      // Calcolo il nextCursor/prevCursor per React-Query
      const allPages = Math.ceil(friendRequests.total / limit);
      const nextCursor: number | undefined = allPages > p.page ? p.page + 1 : undefined;
      const prevCursor: number | undefined = p.page > 1 ? p.page - 1 : undefined;

      res.status(200).json({
        message: 'ok',
        data: friendRequests.data,
        nextCursor: nextCursor,
        prevCursor: prevCursor,
      });
    } catch (error) {
      nex(error);
    }
  };

  public getSentFriendRequests = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      let p = retrivePaginationParamFromRequest(req);

      // Calcolo il limit e l'offset
      const limit = p.size;
      const offset = (p.page - 1) * p.size;

      const friendRequests = await this.friendService.findSentFriendRequestsByUserId(req.user.id, undefined, limit, offset);

      // Calcolo il nextCursor/prevCursor per React-Query
      const allPages = Math.ceil(friendRequests.total / limit);
      const nextCursor: number | undefined = allPages > p.page ? p.page + 1 : undefined;
      const prevCursor: number | undefined = p.page > 1 ? p.page - 1 : undefined;

      res.status(200).json({
        message: 'ok',
        data: friendRequests.data,
        nextCursor: nextCursor,
        prevCursor: prevCursor,
      });
    } catch (error) {
      nex(error);
    }
  };

  public getReceivedFriendRequestsCount = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      const count = await this.friendService.countReceivedFriendRequests(req.user.id);

      res.status(200).json({ count, message: 'ok' });
    } catch (error) {
      nex(error);
    }
  };

  public getSentFriendRequestsCount = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      const count = await this.friendService.countSentFriendRequests(req.user.id);

      res.status(200).json({ count, message: 'ok' });
    } catch (error) {
      nex(error);
    }
  };

  public showFriendship = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);
      if (!findUser) throw new SnapSyncException(404, 'Not found');
      if (findUser.id === req.user.id) throw new SnapSyncException(400, 'Bad request');

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlocked = await this.blockedUserService.isBlockedByUser(findUser.id, req.user.id);
      if (isLoggedUserBlocked) throw new SnapSyncException(404, 'Not found');

      // Recupero il FriendshipStatus
      const fs = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(fs);
    } catch (error) {
      nex(error);
    }
  };

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

      await this.friendService.createFriendship(req.user.id, findUser.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(updatedFriendshipStatus);
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

      await this.friendService.acceptFriendship(req.user.id, findUser.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(updatedFriendshipStatus);
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

      await this.friendService.rejectFriendship(req.user.id, findUser.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(updatedFriendshipStatus);
    } catch (error) {
      nex(error);
    }
  };

  public destroyFriendship = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
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

      // Per poter eliminare un'amicizia, devono essere amici oppure req.user.id deve aver inviato una richiesta a req.params.userId
      if (!fs.isFriend && !fs.outgoingRequest) throw new SnapSyncException(400, 'Bad request');

      await this.friendService.destroyFriendship(req.user.id, findUser.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(updatedFriendshipStatus);
    } catch (error) {
      nex(error);
    }
  };

  public blockUser = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);
      if (findUser.id === req.user.id) throw new SnapSyncException(400, 'Bad request'); // L'utente non può bloccarsi da solo

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlocked = await this.blockedUserService.isBlockedByUser(findUser.id, req.user.id);
      if (isLoggedUserBlocked) throw new SnapSyncException(404, 'Not found');

      // Coontrollo che req.user.id non abbia già bloccato req.params.userId
      const isUserBlocked = await this.blockedUserService.isBlockedByUser(req.user.id, findUser.id);
      if (isUserBlocked) throw new SnapSyncException(400, 'Bad request'); // L'utente non può bloccarsi da solo

      const data: CreateBlockedUserDto = { userId: req.user.id, blockedUserId: findUser.id };

      await this.blockedUserService.blockUser(data);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(updatedFriendshipStatus);
    } catch (error) {
      nex(error);
    }
  };

  public unblockUser = async (req: RequestWithUser, res: Response, nex: NextFunction) => {
    try {
      if (!req.params.userId) throw new SnapSyncException(400, 'Bad request');
      if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad request');

      const userId = parseInt(req.params.userId);

      // Controllo se req.params.userId esiste
      const findUser = await this.userService.findUserById(userId);
      if (findUser.id === req.user.id) throw new SnapSyncException(400, 'Bad request'); // L'utente non può sbloccarsi da solo

      // Controllo che req.user.id non sia bloccato da req.params.userId
      const isLoggedUserBlocked = await this.blockedUserService.isBlockedByUser(findUser.id, req.user.id);
      if (isLoggedUserBlocked) throw new SnapSyncException(404, 'Not found');

      // Coontrollo che req.user.id abbia effettivamente bloccato req.params.userId
      const isUserBlocked = await this.blockedUserService.isBlockedByUser(req.user.id, findUser.id);
      if (!isUserBlocked) throw new SnapSyncException(400, 'Bad request');

      await this.blockedUserService.unblockUser(req.user.id, findUser.id);

      const updatedFriendshipStatus = await this.friendService.getFriendshipStatus(findUser.id, req.user.id);

      res.status(200).json(updatedFriendshipStatus);
    } catch (error) {
      nex(error);
    }
  };
}

export default FriendshipsController;
