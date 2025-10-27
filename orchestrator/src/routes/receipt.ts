import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { generateReceiptPdf } from '../util/pdf.js';
import type { AppraisalReceipt } from '../util/receipts.js';

const router = Router();

// GET /api/receipt/pdf/:id  -> returns a generated PDF from saved receipt JSON
router.get('/pdf/:id', async (req, res) => {
  const id = req.params.id;
  if (!id || !/^apr_[A-Za-z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'invalid_id' });
    }

  try {
    const file = join(process.cwd(), '..', 'data', 'receipts', `${id}.json`);
    const raw = await readFile(file, 'utf8');
    const receipt = JSON.parse(raw) as AppraisalReceipt;

    const pdfBytes = await generateReceiptPdf(receipt);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${id}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (e) {
    return res.status(404).json({ error: 'receipt_not_found' });
  }
});

export default router;
