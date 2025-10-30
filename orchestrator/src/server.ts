import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import appraiseRoute from './routes/appraise.js';
import vinRoute from './routes/vin.js';
import receiptRoute from './routes/receipt.js';
import { validateOnStartup } from './lib/startup-validation.js';
import { checkCacheHealth } from './lib/cache.js';

const log = pino({ transport: { target: 'pino-pretty' } });
const app = express();

app.use(helmet());
app.use(express.json({ limit: '200kb' }));

/**
 * CORS — strict allowlist:
 * - Local dev UI
 * - GitHub Pages (user & repo path)
 * - Optional: add more with env ALLOW_ORIGINS="https://foo,https://bar"
 */
const DEFAULT_ALLOW = [
  'http://localhost:3000',
  'https://mpalmer79.github.io',
  'https://mpalmer79.github.io/quirk-trade-tool'
];
const EXTRA_ALLOW =
  (process.env.ALLOW_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const ALLOW = new Set<string>([...DEFAULT_ALLOW, ...EXTRA_ALLOW]);

app.use((req, res, next) => {
  const origin = (req.headers.origin as string | undefined) || '';
  if (origin && ALLOW.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin'); // ensure proper caching per origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    // Preflight short-circuit
    return res.sendStatus(204);
  }
  next();
});

// ✅ NEW: Startup validations
try {
  validateOnStartup();
} catch (error) {
  log.error('❌ Startup validation failed:', error);
  process.exit(1);
}

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ✅ NEW: Routes
app.use('/api/appraise', appraiseRoute);
app.use('/api/vin', vinRoute);
app.use('/api/receipt', receiptRoute);

// ============================================================================
// START SERVER
// ============================================================================
async function startServer() {
  try {
    // ✅ NEW: Check cache health
    const cacheHealthy = await checkCacheHealth();
    if (cacheHealthy) {
      log.info('✅ Cache layer: READY (Redis connected)');
    } else if (process.env.REDIS_HOST) {
      log.warn('⚠️  Redis configured but not responding. Will retry on first use.');
    } else {
      log.info('ℹ️  Cache layer: In-memory mode');
    }

    const port = Number(process.env.PORT || 4000);
    const server = app.listen(port, () => {
      log.info({ port, allow: Array.from(ALLOW) }, 'orchestrator listening');
    });

    // ✅ NEW: Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      log.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        log.info('HTTP server closed');

        try {
          const { closeCacheConnection } = await import('./lib/cache.js');
          await closeCacheConnection();
          log.info('Cache connection closed');
        } catch (error) {
          log.error('Error closing cache:', error);
        }

        log.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        log.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
