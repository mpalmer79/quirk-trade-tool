import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorizationService } from '../services/authorization-service.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { auditLog } from '../middleware/logging.js';
import { AppraiseSchema, AppraiseInput } from '../schemas/appraise.js';
import { Permission } from '../types/user.js';
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

/**
 * POST /api/appraise
 * 
 * Create a new appraisal with multi-source valuation quotes
 * 
 * Required auth: Authenticated user with CREATE_APPRAISAL permission
 * Required fields: dealershipId, vehicle info
 * 
 * Returns: Appraisal receipt with quotes and summary
 */
router.post(
  '/',
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req: Request, res: Response) => {
    // ============================================================================
    // STEP 1: VALIDATE PERMISSION
    // ============================================================================
    if (!authorizationService.hasPermission(req.user!, Permission.CREATE_APPRAISAL)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'You do not have permission to create appraisals'
      });
    }

    // ============================================================================
    // STEP 2: VALIDATE DEALERSHIP ACCESS
    // ============================================================================
    const dealershipId = req.body.dealershipId;
    if (!dealershipId) {
      return res.status(400).json({
        error: 'missing_dealership',
        message: 'dealershipId is required'
      });
    }

    if (!authorizationService.canAccessDealership(req.user!, dealershipId)) {
      return res.status(403).json({
        error: 'dealership_access_denied',
        message: `You do not have access to dealership ${dealershipId}`
      });
    }

    // ============================================================================
    // STEP 3: VALIDATE REQUEST BODY
    // ============================================================================
    let input: AppraiseInput;
    try {
      input = AppraiseSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid appraisal data',
        details: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }

    const userId = req.user!.userId;

    // ============================================================================
    // STEP 4: FAN OUT TO PROVIDERS
    // ============================================================================
    const quotes: SourceQuote[] = await Promise.all(adapters.map(a => a.quote(input)));

    // ============================================================================
    // STEP 5: AGGREGATE & SUMMARIZE
    // ============================================================================
    const summary = aggregate(quotes);
    if (!summary) {
      return res.status(500).json({ error: 'aggregation_failed' });
    }

    // ============================================================================
    // STEP 6: CREATE RECEIPT WITH USER & DEALERSHIP TRACKING
    // ============================================================================
    const receipt = {
      id: newReceiptId(),
      userId,                                      // ← Track who created this
      dealershipId,                                // ← Track which dealership
      createdAt: new Date().toISOString(),
      input,
      quotes: quotes.map(q => ({ source: q.source, value: q.value })),
      summary,
      provenance: {
        sources: adapters.map(a => a.name),
        simulated: true
      }
    };

    // ============================================================================
    // STEP 7: SAVE RECEIPT
    // ============================================================================
    await saveReceipt(receipt);

    // ============================================================================
    // STEP 8: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId,
      action: 'CREATE_APPRAISAL',
      resourceType: 'appraisal',
      resourceId: receipt.id,
      dealershipId,
      metadata: {
        year: input.year,
        make: input.make,
        model: input.model,
        finalValue: summary.avg
      },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================
    // STEP 9: RETURN RESPONSE
    // ============================================================================
    res.status(201).json({
      id: receipt.id,
      userId,
      dealershipId,
      quotes: receipt.quotes,
      summary: receipt.summary,
      createdAt: receipt.createdAt,
      note: 'Simulated providers. Replace adapters with licensed integrations for production.'
    });
  })
);

export default router;
