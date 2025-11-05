import type { NextFunction, Request, Response } from 'express';

export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    // Keep the original end with its signature
    const originalEnd = res.end.bind(res) as (...args: Parameters<Response['end']>) => ReturnType<Response['end']>;
    let bytes = 0;

    // Reassign with a typed wrapper that returns the same type as Response['end']
    res.end = ((...args: Parameters<Response['end']>) => {
      if (args[0] && typeof args[0] !== 'function') {
        const chunk = args[0] as unknown;
        if (typeof chunk === 'string') bytes += Buffer.byteLength(chunk);
        else if (Buffer.isBuffer(chunk)) bytes += chunk.length;
      }
      const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} ${bytes}B ${durationMs}ms`);
      return originalEnd(...args);
    }) as Response['end'];

    next();
  };
}
