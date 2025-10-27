import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { AppraiseSchema, AppraiseInput } from '../schemas/appraise.js';
import { aggregate } from '../valuation/aggregate.js';
import type { ProviderAdapter, SourceQuote } from '../adapters/types.js';
import bb from '../adapters/demoBlackBook.js';
import kbb from '../adapters/demoKbb.js';
import nada from '../adapters/demoNada.js';
import mmr from '../adapters/demoManheim.js';
import auc from '../adapters/demoAuction.js';
import { saveReceipt, newReceiptId } from '../util/receipts.js';

const router = Router();

const adapters: ProviderAdapter[] = [bb, kbb, nada, mmr, auc];

router.post('/', validate(AppraiseSchema), async (req, res) => {
  const input = req.body as AppraiseInput;

  // Fan out to providers (sequential for demo; parallel in real world)
  const quotes: SourceQuote[] = await Promise.all(adapters.map(a => a.quote(input)));

  // Outlier handling would go here (drop >25% from median) if needed

  const summary = aggregate(quotes);
  if (!summary) return res.status(500).json({ error: 'aggregation_failed' });

  const receipt = {
    id: newReceiptId(),
    createdAt: new Date().toISOString(),
    input,
    quotes: quotes.map(q => ({ source: q.source, value: q.value })),
    summary,
    provenance: {
      sources: adapters.map(a => a.name),
      simulated: true
    }
  };

  await saveReceipt(receipt);

  res.json({
    id: receipt.id,
    quotes: receipt.quotes,
    summary: receipt.summary,
    note: 'Simulated providers. Replace adapters with licensed integrations for production.'
  });
});

export default router;
