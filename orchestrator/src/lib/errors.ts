/**
 * Custom Error Types for Quirk Trade Tool
 * Provides specific, user-friendly error messages for different failure scenarios
 */

/**
 * Base error class for all Quirk Trade Tool errors
 */
export class QuirkTradeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly userMessage: string;
  
  constructor(
    code: string,
    message: string,
    userMessage: string,
    statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Provider API error - when a valuation provider fails
 */
export class ProviderAPIError extends QuirkTradeError {
  public readonly provider: string;
  public readonly providersAvailable: number;
  public readonly providersTotal: number;
  
  constructor(
    provider: string,
    message: string,
    providersAvailable: number = 0,
    providersTotal: number = 0
  ) {
    super(
      'PROVIDER_API_ERROR',
      `${provider} API failed: ${message}`,
      providersAvailable > 0
        ? `One of our valuation providers (${provider}) is temporarily unavailable. Your valuation uses data from our other ${providersAvailable} provider${providersAvailable > 1 ? 's' : ''}.`
        : `Valuation provider ${provider} is temporarily unavailable. Please try again later.`,
      503
    );
    this.provider = provider;
    this.providersAvailable = providersAvailable;
    this.providersTotal = providersTotal;
  }
}

/**
 * VIN decode error - when VIN decoding fails
 */
export class VINDecodeError extends QuirkTradeError {
  public readonly vin: string;
  
  constructor(vin: string, message: string) {
    super(
      'VIN_DECODE_ERROR',
      `Failed to decode VIN ${vin}: ${message}`,
      `We couldn't decode the VIN "${vin}". Please verify it's a valid 17-character VIN and try again.`,
      400
    );
    this.vin = vin;
  }
}

/**
 * Validation error - when request data is invalid
 */
export class ValidationError extends QuirkTradeError {
  public readonly field: string;
  public readonly value: any;
  
  constructor(field: string, value: any, message: string) {
    super(
      'VALIDATION_ERROR',
      `Validation failed for ${field}: ${message}`,
      `Invalid ${field}: ${message}`,
      400
    );
    this.field = field;
    this.value = value;
  }
}

/**
 * Authentication error - when authentication fails
 */
export class AuthenticationError extends QuirkTradeError {
  constructor(message: string = 'Authentication failed') {
    super(
      'AUTHENTICATION_ERROR',
      message,
      'You must be logged in to perform this action.',
      401
    );
  }
}

/**
 * Authorization error - when user lacks permission
 */
export class AuthorizationError extends QuirkTradeError {
  public readonly requiredRole?: string;
  
  constructor(message: string = 'Access denied', requiredRole?: string) {
    super(
      'AUTHORIZATION_ERROR',
      message,
      requiredRole
        ? `You don't have permission to perform this action. Required role: ${requiredRole}`
        : 'You don\'t have permission to perform this action.',
      403
    );
    this.requiredRole = requiredRole;
  }
}

/**
 * Cache error - when cache operations fail
 */
export class CacheError extends QuirkTradeError {
  public readonly operation: 'get' | 'set' | 'delete';
  
  constructor(operation: 'get' | 'set' | 'delete', message: string) {
    super(
      'CACHE_ERROR',
      `Cache ${operation} failed: ${message}`,
      'A temporary caching issue occurred. Your request will proceed without cache.',
      500
    );
    this.operation = operation;
  }
}

/**
 * Database error - when database operations fail
 */
export class DatabaseError extends QuirkTradeError {
  public readonly operation: string;
  
  constructor(operation: string, message: string) {
    super(
      'DATABASE_ERROR',
      `Database ${operation} failed: ${message}`,
      'A database error occurred. Please try again later.',
      500
    );
    this.operation = operation;
  }
}

/**
 * Rate limit error - when rate limit is exceeded
 */
export class RateLimitError extends QuirkTradeError {
  public readonly retryAfter: number;
  
  constructor(retryAfter: number = 60) {
    super(
      'RATE_LIMIT_ERROR',
      'Rate limit exceeded',
      `You've made too many requests. Please wait ${retryAfter} seconds before trying again.`,
      429
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Not found error - when a resource is not found
 */
export class NotFoundError extends QuirkTradeError {
  public readonly resource: string;
  public readonly id: string;
  
  constructor(resource: string, id: string) {
    super(
      'NOT_FOUND_ERROR',
      `${resource} not found: ${id}`,
      `${resource} not found.`,
      404
    );
    this.resource = resource;
    this.id = id;
  }
}

/**
 * Insufficient quotes error - when not enough provider quotes are available
 */
export class InsufficientQuotesError extends QuirkTradeError {
  public readonly quotesReceived: number;
  public readonly quotesRequired: number;
  
  constructor(quotesReceived: number, quotesRequired: number = 2) {
    super(
      'INSUFFICIENT_QUOTES_ERROR',
      `Insufficient quotes: received ${quotesReceived}, required ${quotesRequired}`,
      `We couldn't get enough valuation quotes to provide an accurate estimate. Only ${quotesReceived} provider${quotesReceived !== 1 ? 's' : ''} responded. Please try again later.`,
      503
    );
    this.quotesReceived = quotesReceived;
    this.quotesRequired = quotesRequired;
  }
}

/**
 * Helper to check if error is a QuirkTradeError
 */
export function isQuirkTradeError(error: any): error is QuirkTradeError {
  return error instanceof QuirkTradeError;
}

/**
 * Helper to format error for API response
 */
export function formatErrorResponse(error: any): {
  error: string;
  code: string;
  message: string;
  statusCode: number;
  details?: any;
} {
  if (isQuirkTradeError(error)) {
    return {
      error: error.name,
      code: error.code,
      message: error.userMessage,
      statusCode: error.statusCode,
      details: {
        ...(error instanceof ProviderAPIError && {
          provider: error.provider,
          providersAvailable: error.providersAvailable,
          providersTotal: error.providersTotal,
        }),
        ...(error instanceof VINDecodeError && {
          vin: error.vin,
        }),
        ...(error instanceof ValidationError && {
          field: error.field,
        }),
        ...(error instanceof RateLimitError && {
          retryAfter: error.retryAfter,
        }),
        ...(error instanceof NotFoundError && {
          resource: error.resource,
          id: error.id,
        }),
        ...(error instanceof InsufficientQuotesError && {
          quotesReceived: error.quotesReceived,
          quotesRequired: error.quotesRequired,
        }),
      },
    };
  }
  
  // Generic error fallback
  return {
    error: 'InternalServerError',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
  };
}
