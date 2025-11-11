import pino from 'pino';

const log = pino();

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration options
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === opts.maxAttempts) {
        log.error(`All ${opts.maxAttempts} retry attempts failed:`, lastError);
        throw lastError;
      }

      // Check if error is retryable (for fetch responses)
      const shouldRetry = isRetryableError(error, opts.retryableStatusCodes);
      if (!shouldRetry) {
        log.warn(`Non-retryable error encountered, not retrying:`, lastError);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      log.warn(
        `Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`,
        { error: lastError.message }
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed without error');
}

/**
 * Retry a fetch request with exponential backoff
 * @param url URL to fetch
 * @param init Fetch options
 * @param options Retry configuration options
 * @returns Fetch response
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);

    // Check if we should retry based on status code
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    if (opts.retryableStatusCodes.includes(response.status)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }, options);
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
  if (!(error instanceof Error)) return false;

  // Check for network errors
  if (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('network') ||
    error.message.includes('timeout')
  ) {
    return true;
  }

  // Check for HTTP status code errors
  const statusMatch = error.message.match(/HTTP (\d+)/);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10);
    return retryableStatusCodes.includes(statusCode);
  }

  return false;
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
