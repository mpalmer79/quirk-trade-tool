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
    public details?: unknown
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
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default error response
  let statusCode = 500;
  let code = 'internal_server_error';
  let message = 'Something went wrong';
  let details: unknown = undefined;

  // Cast to a general error shape for property access
  const error = err as { name?: string; code?: string; message?: string; issues?: unknown; stack?: string };

  // Handle API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle Zod validation errors
  else if (error.name === 'ZodError') {
    statusCode = 400;
    code = 'validation_error';
    message = 'Validation failed';
    details = error.issues;
  }
  // Handle database errors
  else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    code = 'database_unavailable';
    message = 'Database connection failed';
  }
  // Handle file system errors
  else if (error.code === 'ENOENT') {
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
    error: error.message,
    stack: error.stack,
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
  const response: Record<string, unknown> = {
    error: code,
    message
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper: catches errors in async route handlers
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
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
