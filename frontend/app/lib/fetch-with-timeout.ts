/**
 * Fetch with timeout support
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 30000ms = 30 seconds)
 * @returns Fetch response
 * @throws Error if request times out or fails
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if the error is due to abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }

    throw error;
  }
}

/**
 * Fetch with timeout and retry logic
 * @param url URL to fetch
 * @param options Fetch options
 * @param config Configuration for timeout and retry
 * @returns Fetch response
 */
export async function fetchWithTimeoutAndRetry(
  url: string,
  options?: RequestInit,
  config: {
    timeoutMs?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<Response> {
  const {
    timeoutMs = 30000,
    maxRetries = 2,
    retryDelay = 1000,
  } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed');
}
