import { Friends } from '@/models/friends.model';
import { Users } from '@/models/users.model';
import { NextFunction, Request, Response } from 'express';

class IndexController {
  public ping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // const users = await Users.query().whereNotDeleted();

      // // Creo dei friends falsi per testare la relazione

      // for (let i = 0; i < users.length; i++) {
      //   const user = users[Math.floor(Math.random() * users.length)];
      //   const friend = users[Math.floor(Math.random() * users.length)];
      //   if (user.id !== friend.id) {
      //     // Controllo se esiste già la relazione
      //     const exists = await Friends.query()
      //       .whereNotDeleted()
      //       .andWhere(builder => {
      //         builder.orWhere({ userId: user.id, friendId: friend.id }).orWhere({ userId: friend.id, friendId: user.id });
      //       });

      //     if (exists.length === 0) {
      //       const status = Math.floor(Math.random() * 3);
      //       await Friends.query().insert({
      //         userId: user.id,
      //         friendId: friend.id,
      //         status: status === 0 ? 'pending' : status === 1 ? 'accepted' : 'rejected',
      //         acceptedAt: status === 1 ? new Date() : null,
      //         rejectedAt: status === 2 ? new Date() : null,
      //       });
      //     }
      //   }
      // }

      const friends = await Friends.query().whereNotDeleted().andWhere('status', 'rejected');

      await Friends.query()
        .delete()
        .whereIn(
          'id',
          friends.map(friend => friend.id),
        );

      res.status(200).json({ message: 'pong' });
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
