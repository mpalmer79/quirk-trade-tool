import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import appraiseRoute from './routes/appraise.js';
import vinRoute from './routes/vin.js';
// ...
app.use('/api/vin', vinRoute);

const log = pino({ transport: { target: 'pino-pretty' } });
const app = express();

app.use(helmet());
app.use(express.json({ limit: '200kb' }));

// basic CORS for local dev (tighten in prod)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/appraise', appraiseRoute);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => log.info({ port }, 'orchestrator listening'));
