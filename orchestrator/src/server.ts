import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';

import appraiseRoute from './routes/appraise.js';
import vinRoute from './routes/vin.js';
import receiptRoute from './routes/receipt.js';

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

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/appraise', appraiseRoute);
app.use('/api/vin', vinRoute);
app.use('/api/receipt', receiptRoute);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => log.info({ port, allow: Array.from(ALLOW) }, 'orchestrator listening'));
