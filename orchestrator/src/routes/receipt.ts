import { Router, Request, Response } from 'express';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { authenticate } from '../middleware/auth.js';
import { authorizationService } from '../services/authorization-service.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { auditLog } from '../middleware/logging.js';
import { env } from '../config/env.js';
import { generateReceipt } from '../services/receipt-service.js';
import { Permission } from '../types/user.js';
import type { ValuationResult, ValuationRequest } from '../types/valuation.types.js';

// ✅ EXISTING: Keep your types and functions
export type AppraisalReceipt = {
  id: string;
  userId: string;                                  // ← NEW: Track creator
  dealershipId: string;                            // ← NEW: Track dealership
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
 * 
 * Retrieve receipt as JSON
 * 
 * Required auth: Authenticated user with VIEW_APPRAISAL_HISTORY permission
 * Dealership access: User must have access to the receipt's dealership
 * 
 * Returns: Receipt data in JSON format
 */
router.get(
  '/json/:id',
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ============================================================================
    // STEP 1: VALIDATE PERMISSION
    // ============================================================================
    if (!authorizationService.hasPermission(req.user!, Permission.VIEW_APPRAISAL_HISTORY)) {
      res.status(403).json({
        error: 'insufficient_permissions',
        message: 'You do not have permission to view appraisal history'
      });
      return;
    }

    // ============================================================================
    // STEP 2: RETRIEVE RECEIPT
    // ============================================================================
    const { id } = req.params;
    const receipt = await getReceiptFromStorage(id);

    if (!receipt) {
      res.status(404).json({
        error: 'receipt_not_found',
        message: `Receipt ${id} not found`,
        id
      });
      return;
    }

    // ============================================================================
    // STEP 3: VALIDATE DEALERSHIP ACCESS
    // ============================================================================
    if (!authorizationService.canAccessDealership(req.user!, receipt.dealershipId)) {
      res.status(403).json({
        error: 'dealership_access_denied',
        message: `You do not have access to dealership ${receipt.dealershipId}`
      });
      return;
    }

    // ============================================================================
    // STEP 4: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId: req.user!.userId,
      action: 'VIEW_RECEIPT_JSON',
      resourceType: 'receipt',
      resourceId: id,
      dealershipId: receipt.dealershipId,
      metadata: {
        receiptCreatedBy: receipt.userId,
        receiptCreatedAt: receipt.createdAt
      },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================
    // STEP 5: RETURN RESPONSE
    // ============================================================================
    res.json(receipt);
  })
);

/**
 * GET /api/receipt/pdf/:id
 * 
 * Generate and download PDF receipt
 * 
 * Required auth: Authenticated user with VIEW_APPRAISAL_HISTORY permission
 * Dealership access: User must have access to the receipt's dealership
 * 
 * Returns: PDF file stream for download
 */
router.get(
  '/pdf/:id',
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ============================================================================
    // STEP 1: VALIDATE PERMISSION
    // ============================================================================
    if (!authorizationService.hasPermission(req.user!, Permission.VIEW_APPRAISAL_HISTORY)) {
      res.status(403).json({
        error: 'insufficient_permissions',
        message: 'You do not have permission to view appraisals'
      });
      return;
    }

    // ============================================================================
    // STEP 2: RETRIEVE RECEIPT
    // ============================================================================
    const { id } = req.params;
    const receipt = await getReceiptFromStorage(id);

    if (!receipt) {
      res.status(404).json({
        error: 'receipt_not_found',
        message: `Receipt ${id} not found`,
        id
      });
      return;
    }

    // ============================================================================
    // STEP 3: VALIDATE DEALERSHIP ACCESS
    // ============================================================================
    if (!authorizationService.canAccessDealership(req.user!, receipt.dealershipId)) {
      res.status(403).json({
        error: 'dealership_access_denied',
        message: `You do not have access to dealership ${receipt.dealershipId}`
      });
      return;
    }

    // ============================================================================
    // STEP 4: GENERATE PDF
    // ============================================================================
    try {
      // Create dealership stub from receipt data
      const dealershipStub = {
        id: receipt.dealershipId,
        name: 'Dealership', // Placeholder - ideally fetch from DB
        city: '',
        state: ''
      };
      
      const pdfStream = await generateReceipt(
        receipt as unknown as ValuationResult,
        dealershipStub
      );

      // ============================================================================
      // STEP 5: AUDIT LOG
      // ============================================================================
      await auditLog({
        userId: req.user!.userId,
        action: 'VIEW_RECEIPT_PDF',
        resourceType: 'receipt',
        resourceId: id,
        dealershipId: receipt.dealershipId,
        metadata: {
          receiptCreatedBy: receipt.userId,
          receiptCreatedAt: receipt.createdAt
        },
        ipAddress: req.ip,
        timestamp: new Date()
      });

      // ============================================================================
      // STEP 6: SET RESPONSE HEADERS
      // ============================================================================
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quirk-appraisal-${id}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      // ============================================================================
      // STEP 7: STREAM PDF TO CLIENT
      // ============================================================================
      pdfStream.pipe(res);

      // ============================================================================
      // STEP 8: HANDLE ERRORS DURING STREAMING
      // ============================================================================
      pdfStream.on('error', (error) => {
        console.error('PDF generation error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'pdf_generation_failed',
            message: 'Failed to generate PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

    } catch (error) {
      console.error('Receipt PDF route error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: 'internal_server_error',
          message: 'Failed to generate PDF receipt',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  })
);

export default router;
