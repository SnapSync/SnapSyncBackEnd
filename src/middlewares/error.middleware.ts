import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { SqlException } from '@/exceptions/SqlException';
import { ValidationError } from 'yup';
import { JsonWebTokenError } from 'jsonwebtoken';
import { i18nKeys } from '@/locales/i18nKeys';

const errorMiddleware = (
  error: HttpException | SqlException | ValidationError | JsonWebTokenError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    var status: number = 500;
    var message: string = req.t('errors.something_went_wrong');
    var type: string = 'HttpException';

    if (error instanceof SqlException) {
      const splittedMessage = error.sqlMessage.split('-');
      type = error.name;

      // Di default torno Something went wrong

      if (splittedMessage.length > 1) {
        status = Number(splittedMessage[0]);
        message = splittedMessage[1];
      } else if (splittedMessage.length == 1) {
        message = splittedMessage[0];
      } else {
        message = 'Something went wrong';
      }
    } else if (error instanceof HttpException) {
      status = error.status;

      let exists = req.i18n.exists(error.i18nKey, error.i);

      message = exists ? req.t(error.i18nKey, error.i) : error.message;

      type = error.type;
    } else if (error instanceof ValidationError) {
      if (error.errors.length > 1) {
        let errorsLength = error.errors.length;
        message = req.t('errors.validation_error', { errorsLength });
      } else {
        message = error.message;
      }

      status = 422;
      type = error.name;
    } else if (error instanceof JsonWebTokenError) {
      status = 401;

      if (error.name === 'TokenExpiredError') {
        // Il token è scaduto
        message = req.t('errors.expired_authentication_token');
      } else {
        message = req.t('errors.invalid_authentication_token');
      }

      // message = error.message;
      type = error.name;
    }

    logger.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}, Stringified:: ${JSON.stringify(error)}, Stack:: ${error.stack}`,
    );
    res.status(status).json({ status, message, type });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
