import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { Users } from '@models/users.model';
import { SnapSyncException } from '@/exceptions/SnapSyncException';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization) {
      const secretKey: string = SECRET_KEY;
      const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const userId = verificationResponse.id;
      const findUser: User = await Users.query().whereNotDeleted().andWhere('isBanned', false).findById(userId);

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new SnapSyncException(401, 'Unauthorized'));
      }
    } else {
      next(new SnapSyncException(403, 'Forbidden'));
    }
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
