import {
  FULLNAME_REGEX,
  MAX_BIO_LENGTH,
  MAX_FULLNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_FULLNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_REGEX,
} from '@/services/validation.service';
import { NextFunction, Request, Response } from 'express';

class AccountsController {
  public getUsernameRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response = {
        maxLength: MAX_USERNAME_LENGTH,
        minLength: MIN_USERNAME_LENGTH,
        regex: USERNAME_REGEX,
      };

      res.status(200).json({ field: 'username', rules: response });
    } catch (error) {
      next(error);
    }
  };

  public getFullNameRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response = {
        maxLength: MIN_FULLNAME_LENGTH,
        minLength: MAX_FULLNAME_LENGTH,
        regex: FULLNAME_REGEX,
      };

      res.status(200).json({ field: 'fullName', rules: response });
    } catch (error) {
      next(error);
    }
  };

  public getBioRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response = {
        maxLength: MAX_BIO_LENGTH,
      };

      res.status(200).json({ field: 'biography', rules: response });
    } catch (error) {
      next(error);
    }
  };
}

export default AccountsController;
