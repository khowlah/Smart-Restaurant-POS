import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.url} ->`, err);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, 'Validation error', 400, formattedErrors);
  }

  // Operational AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Supabase / PostgreSQL custom exceptions
  if (err?.code || err?.hint || err?.message?.includes('violates')) {
    const message = err.message || 'Database transaction error';
    return sendError(res, message, 400);
  }

  // JWT / Auth errors
  if (err.name === 'JsonWebTokenError' || err.message?.includes('jwt') || err.message?.includes('token')) {
    return sendError(res, 'Invalid or expired token', 401);
  }

  // Fallback internal error
  const message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  return sendError(res, message, 500);
};
