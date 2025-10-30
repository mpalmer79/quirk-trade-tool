import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const log = pino();

/**
 * Add correlation ID and request logging
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  const requestId = uuidv4();

  // Attach to request for downstream use
  req.requestId = requestId;
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', requestId);

  const start = Date.now();

  // Log request received
  log.debug({
    correlationId,
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.userId
  });

  // Hook response.end to log response
  const originalEnd = res.end;

  res.end = function(...args: any[]) {
    const duration = Date.now() - start;

    log.info({
      correlationId,
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Audit logging for sensitive operations
 */
export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  dealershipId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

export const auditLog = (entry: AuditLogEntry) => {
  log.info({
    type: 'audit',
    action: entry.action,
    userId: entry.userId,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    dealershipId: entry.dealershipId,
    metadata: entry.metadata,
    ipAddress: entry.ipAddress,
    timestamp: entry.timestamp.toISOString()
  });

  // TODO: Save to database for audit trail
  // await auditLogRepository.save(entry);
};
