import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import FriendService from '@/services/friends.service';
import UserService from '@/services/users.service';
import UserContactService from '@/services/users_contacts.service';
import { NextFunction, Response } from 'express';

class SearchesController {
  public friendService = new FriendService();
  public userService = new UserService();
  public userContactService = new UserContactService();

  public search = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.query.q) throw new SnapSyncException(400, 'Bad request');

      // Controllo che la query sia una stringa e sia almeno lunga 1 carattere
      if (typeof req.query.q !== 'string' || req.query.q.length < 1) throw new SnapSyncException(400, 'Bad request');

      // Elimino gli spazi bianchi all'inizio e alla fine della stringa e controllo che non sia vuota
      const query = req.query.q.toLowerCase().trim();
      if (query.length < 1) throw new SnapSyncException(400, 'Bad request');

      const friends = await this.friendService.findFriendsByUserId(req.user.id, query, 20, 0);
      const sent = await this.friendService.findSentFriendRequestsByUserId(req.user.id, query, 20, 0);
      const received = await this.friendService.findReceivedFriendRequestsByUserId(req.user.id, query, 20, 0);
      const contacts = await this.userContactService.searchUserContacts(req.user.id, query, 20, 0);
      const users = await this.userService.searchUsers(req.user.id, query, 20, 0);

      let response = {
        friends: friends.data,
        sent: sent.data,
        received: received.data,
        contacts: contacts,
        others: users,
        message: 'ok',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export default SearchesController;
