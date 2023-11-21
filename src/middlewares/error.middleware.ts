import { NextFunction, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { SqlException } from '@/exceptions/SqlException';
import { ValidationError } from 'yup';
import { JsonWebTokenError } from 'jsonwebtoken';
import { SnapSyncException } from '@/exceptions/SnapSyncException';

const errorMiddleware = (
  error: SqlException | ValidationError | JsonWebTokenError | SnapSyncException,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    var status: number = 500;
    var message: string = req.t('errors.something_went_wrong');
    var type: string | null = null;
    var fields: string[] | null = null;
    var timestamp: Date = new Date();
    var data: any = null;

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
    } else if (error instanceof ValidationError) {
      error.inner.forEach(e => {
        if (fields == null) fields = [];

        fields.push(e.path);
      });

      status = 422;
      type = error.name;
      message = 'Unprocessable Entity';
    } else if (error instanceof JsonWebTokenError) {
      status = 401;
      message = 'Unauthorized';
      type = error.name;
    } else if (error instanceof SnapSyncException) {
      message = error.message;
      status = error.status;
      type = error.errorKey;
      data = error.data;
      fields = error.fields;
    }

    logger.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}, Stringified:: ${JSON.stringify(error)}, Stack:: ${error.stack}`,
    );
    res.status(status).json({ status, message, type, data, fields, timestamp });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
