import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import rateLimit from 'express-rate-limit';

import { requestLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/error-handler.js';

import { authService } from './services/auth-service.js';
import { db, validateDatabaseConnection } from './db/index.js';

import authRoute from './routes/auth.js';
import vinRoute from './routes/vin.js';

const log = pino();
const app = express();

/* ============================================================================
   STARTUP VALIDATION
============================================================================ */
function validateStartup() {
  log.info('🔍 Validating startup configuration...');

  // JWT configuration
  if (!authService.validateConfiguration()) {
    log.error('❌ JWT configuration invalid');
    process.exit(1);
  }

  // Required env vars (extend as needed)
  const required = ['JWT_SECRET', 'DB_NAME', 'DB_USER'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    log.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  log.info('✅ Startup validation passed');
}

/* ============================================================================
   SECURITY / BODY PARSING
============================================================================ */
app.use(helmet());
app.use(express.json({ limit: '200kb' }));

/* ============================================================================
   CORS
============================================================================ */
const DEFAULT_ALLOW = [
  'http://localhost:3000',
  'https://mpalmer79.github.io',
  'https://mpalmer79.github.io/quirk-trade-tool',
];

const EXTRA_ALLOW = (process.env.ALLOW_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW = new Set<string>([...DEFAULT_ALLOW, ...EXTRA_ALLOW]);

app.use((req, res, next) => {
  const origin = (req.headers.origin as string | undefined) || '';
  if (origin && ALLOW.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ============================================================================
   REQUEST LOGGING / CORRELATION ID
============================================================================ */
app.use(requestLogger);

/* ============================================================================
   RATE LIMITING
============================================================================ */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // never rate-limit health probes
  skip: (req) =>
    req.path === '/health' ||
    req.path === '/health/live' ||
    req.path === '/health/ready' ||
    req.path === '/healthz' ||
    req.path === '/readyz',
});
app.use(apiLimiter);

// Stricter on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
});

/* ============================================================================
   HEALTH / READINESS (Docker/K8s friendly)
   - /healthz : liveness (process up)
   - /readyz  : readiness (deps OK)
   Keep your existing /health/* for compatibility.
============================================================================ */
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

app.get(
  '/readyz',
  asyncHandler(async (_req, res) => {
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) return res.status(503).json({ ok: false });
    res.status(200).json({ ok: true });
  }),
);

// Backward-compat aliases for anything already pinging these:
app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      return res.status(503).json({
        ok: false,
        error: 'database_unavailable',
      });
    }
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  }),
);
app.get('/health/live', (_req, res) => res.json({ ok: true }));
app.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) return res.status(503).json({ ok: false });
    res.json({ ok: true });
  }),
);

/* ============================================================================
   ROUTES
============================================================================ */
// Rate-limit the login POST specifically, then hand off to the auth router
app.post('/api/auth/login', loginLimiter, (_req, _res, next) => next());
app.use('/api/auth', authRoute);

// VIN routes
app.use('/api/vin', vinRoute);

/* ============================================================================
   404 / ERROR HANDLERS
============================================================================ */
app.use(notFoundHandler);
app.use(errorHandler);

/* ============================================================================
   GRACEFUL SHUTDOWN
============================================================================ */
let server: ReturnType<typeof app.listen> | undefined;

const gracefulShutdown = (signal: string) => {
  log.info(`${signal} received. Starting graceful shutdown...`);

  if (!server) {
    log.warn('HTTP server not started yet; exiting.');
    process.exit(0);
  }

  server.close(async () => {
    log.info('HTTP server closed');
    try {
      await db.end();
      log.info('Database connection closed');
    } catch (error) {
      log.error('Error closing database:', error);
    }
    log.info('✅ Graceful shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    log.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/* ============================================================================
   START SERVER
   - Default PORT 3001 to match docker-compose and health checks
============================================================================ */
export async function startServer() {
  try {
    validateStartup();
    await validateDatabaseConnection();

    const port = Number(process.env.PORT || 3001);
    server = app.listen(port, () => {
      log.info({
        port,
        environment: process.env.NODE_ENV,
        allowedOrigins: Array.from(ALLOW),
        message: '🚀 Orchestrator API listening',
      });
    });

    return server;
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((err) => {
  log.error({ err }, 'Failed to launch server');
  process.exit(1);
});

export default app;
