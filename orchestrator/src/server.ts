import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import rateLimit from 'express-rate-limit';

// Import new middleware
import { requestLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/error-handler.js';
import { authenticate } from './middleware/auth.js';

// Import services
import { authService } from './services/auth-service.js';
import { db, validateDatabaseConnection } from './db/index.js';

// Import routes
import authRoute from './routes/auth.js';

const log = pino();
const app = express();

// ============================================================================
// STARTUP VALIDATION
// ============================================================================

function validateStartup() {
  log.info('🔍 Validating startup configuration...');

  // Check JWT configuration
  if (!authService.validateConfiguration()) {
    log.error('❌ JWT configuration invalid');
    process.exit(1);
  }

  // Check required environment variables
  const required = ['JWT_SECRET', 'DB_NAME', 'DB_USER'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  log.info('✅ Startup validation passed');
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

app.use(helmet());
app.use(express.json({ limit: '200kb' }));

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const DEFAULT_ALLOW = [
  'http://localhost:3000',
  'https://mpalmer79.github.io',
  'https://mpalmer79.github.io/quirk-trade-tool'
];

const EXTRA_ALLOW = (process.env.ALLOW_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
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
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// ============================================================================
// REQUEST LOGGING & CORRELATION ID
// ============================================================================

app.use(requestLogger);

// ============================================================================
// RATE LIMITING
// ============================================================================

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/health/live'
});

app.use(apiLimiter);

// Login endpoint rate limit (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// ============================================================================
// HEALTH CHECKS
// ============================================================================

app.get('/health', asyncHandler(async (req, res) => {
  const dbHealthy = await db.healthCheck();
  
  if (!dbHealthy) {
    return res.status(503).json({
      ok: false,
      error: 'database_unavailable'
    });
  }

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
}));

app.get('/health/live', (req, res) => {
  res.json({ ok: true });
});

app.get('/health/ready', asyncHandler(async (req, res) => {
  const dbHealthy = await db.healthCheck();
  
  if (!dbHealthy) {
    return res.status(503).json({ ok: false });
  }
  
  res.json({ ok: true });
}));

// ============================================================================
// ROUTES
// ============================================================================

// Auth routes (use stricter rate limiting for login)
app.post('/api/auth/login', loginLimiter, (req, res, next) => next());
app.use('/api/auth', authRoute);

// TODO: Add other routes here (appraise, vin, receipt)
// For now, just auth is wired up
import vinRoute from './routes/vin.js';

app.use('/api/vin', vinRoute);
// ============================================================================
// 404 HANDLER
// ============================================================================

app.use(notFoundHandler);

// ============================================================================
// ERROR HANDLER (must be last)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = (signal: string) => {
  log.info(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
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

  // Force shutdown after 30 seconds
  setTimeout(() => {
    log.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Validate configuration
    validateStartup();

    // Validate database connection
    await validateDatabaseConnection();

    const port = Number(process.env.PORT || 4000);
    
    const server = app.listen(port, () => {
      log.info({
        port,
        environment: process.env.NODE_ENV,
        allowedOrigins: Array.from(ALLOW),
        message: '🚀 Orchestrator API listening'
      });
    });

    return server;
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

let server: any;

startServer().then(s => {
  server = s;
});

export default app;
