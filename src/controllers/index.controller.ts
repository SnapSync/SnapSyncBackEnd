import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // var lng = req.language; // 'de-CH'
      // var lngs = req.languages; // ['de-CH', 'de', 'en']
      // var exists = req.i18n.exists('Hello');
      const response = req.t('Hello');
      res.status(200).json({ response });
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
