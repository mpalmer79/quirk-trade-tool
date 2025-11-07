import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const log = pino();

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 * Must be registered LAST in express app
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error response
  let statusCode = 500;
  let code = 'internal_server_error';
  let message = 'Something went wrong';
  let details: any = undefined;

  // Handle API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle Zod validation errors
  else if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'validation_error';
    message = 'Validation failed';
    details = err.issues;
  }
  // Handle database errors
  else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    code = 'database_unavailable';
    message = 'Database connection failed';
  }
  // Handle file system errors
  else if (err.code === 'ENOENT') {
    statusCode = 404;
    code = 'not_found';
    message = 'Resource not found';
  }
  // Handle JSON parse errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'invalid_json';
    message = 'Invalid JSON in request body';
  }

  // Log error
  log.error({
    error: err.message,
    stack: err.stack,
    code,
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    requestId: req.requestId,
    // Don't log sensitive data
    body: req.method !== 'POST' ? req.body : undefined
  });

  // Send error response
  const response: any = {
    error: code,
    message
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper: catches errors in async route handlers
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
};
