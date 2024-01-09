import { CountResponse } from '@/interfaces/api.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { NextFunction, Response } from 'express';

class SnapsController {
  public getSnapsCount = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      let cr: CountResponse = {
        count: 0,
        message: 'ok',
      };

      res.status(200).json({ ...cr });
    } catch (error) {
      next(error);
    }
  };
}

export default SnapsController;
