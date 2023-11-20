import { NextFunction, Request, Response } from 'express';

class IndexController {
  public ping = (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.status(200).json({ message: 'pong' });
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
