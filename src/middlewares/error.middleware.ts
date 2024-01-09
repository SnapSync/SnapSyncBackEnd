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
    var message: string = 'Ops! An error occurred.';
    var type: string | null = null;
    var fields: string[] | null = null;
    var timestamp: Date = new Date();
    var data: any = null;

    if (error instanceof SqlException) {
      const sqlMessage = error.sqlMessage;
      type = error.code;

      // Se message è un numero, allora è lo status code
      if (!isNaN(Number(sqlMessage))) {
        status = Number(sqlMessage);
        // message = error.sqlMessage;
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
