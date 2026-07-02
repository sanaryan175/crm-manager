import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Log unexpected errors
    console.error('Unexpected Error:', err);
  }

  // Include stack trace in development mode
  const errorMsg = process.env.NODE_ENV === 'development' ? `${message} (Stack: ${err.stack || ''})` : message;

  sendError(res, errorMsg, statusCode);
};
