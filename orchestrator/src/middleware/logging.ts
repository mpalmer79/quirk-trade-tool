import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { nanoid } from 'nanoid';

const log = pino();

// Extend Express Request to include requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  
  // Add request ID
  req.requestId = nanoid();
  
  // Log request
  log.info({
    method: req.method,
    url: req.url,
    requestId: req.requestId,
    ip: req.ip
  });
  
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
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} ${bytes}B ${durationMs}ms`);
    return originalEnd(...args);
  }) as Response['end'];
  
  next();
}

// Audit log function for security events
export async function auditLog(data: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  timestamp: Date;
}) {
  log.info({
    type: 'AUDIT',
    ...data
  });
}
