import { Router, Request, Response } from 'express';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { generateReceipt } from '../services/receipt-service.js';

// ✅ EXISTING: Keep your types and functions
export type AppraisalReceipt = {
  id: string;
  createdAt: string;
  input: Record<string, unknown>;
  quotes: { source: string; value: number }[];
  summary: { low: number; high: number; avg: number; confidence: string };
  provenance: { sources: string[]; simulated: boolean; region?: string };
};

export async function saveReceipt(receipt: AppraisalReceipt) {
  const dir = join(process.cwd(), env.RECEIPTS_DIR);
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${receipt.id}.json`);
  await writeFile(file, JSON.stringify(receipt, null, 2), 'utf8');
  return file;
}

export function newReceiptId() {
  return `apr_${nanoid(12)}`;
}

// ✅ NEW: Retrieve receipt from JSON storage
async function getReceiptFromStorage(id: string): Promise<AppraisalReceipt | null> {
  try {
    const dir = join(process.cwd(), env.RECEIPTS_DIR);
    const file = join(dir, `${id}.json`);
    const data = await readFile(file, 'utf8');
    return JSON.parse(data) as AppraisalReceipt;
  } catch (error) {
    return null;
  }
}

// ✅ NEW: Router setup
const router = Router();

/**
 * GET /api/receipt/json/:id
 * Retrieve receipt as JSON
 */
router.get('/json/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await getReceiptFromStorage(id);

    if (!receipt) {
      return res.status(404).json({
        error: 'Receipt not found',
        id,
      });
    }

    res.json(receipt);
  } catch (error) {
    console.error('Receipt retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/receipt/pdf/:id
 * Generate and download PDF receipt
 */
router.get('/pdf/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Retrieve the stored receipt
    const receipt = await getReceiptFromStorage(id);
    if (!receipt) {
      return res.status(404).json({
        error: 'Receipt not found',
        id,
      });
    }

    // ✅ NEW: Generate PDF from receipt
    const pdfStream = await generateReceipt(
      receipt as any,  // Cast to ValuationResult type for now
      receipt.input as any
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quirk-appraisal-${id}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Stream the PDF to the client
    pdfStream.pipe(res);

    // Handle errors during streaming
    pdfStream.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to generate PDF',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

  } catch (error) {
    console.error('Receipt PDF route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
