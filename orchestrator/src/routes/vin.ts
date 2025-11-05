import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { auditLog } from '../middleware/logging.js';
import { decodeVin } from '../vin/index.js';
import { db } from '../db/index.js';

const router = Router();

/**
 * Validation schema for VIN decode request
 */
const VinSchema = z.object({
  vin: z.string().min(11).max(20)
});

/**
 * POST /api/vin/decode
 * 
 * Decode a VIN and return vehicle information
 * 
 * Required auth: Authenticated user (any role)
 * Required fields: vin (11-20 characters)
 * 
 * Returns: Decoded vehicle data (year, make, model, body type, engine, etc.)
 */
router.post(
  '/decode',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // ============================================================================
    // STEP 1: VALIDATE REQUEST
    // ============================================================================
    try {
      var parsed = VinSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid VIN format',
        details: error instanceof Error ? error.message : 'VIN must be 11-20 characters'
      });
    }

    const { vin } = parsed;
    const userId = req.user!.userId;

    // ============================================================================
    // STEP 2: DECODE VIN
    // ============================================================================
    try {
      const result = await decodeVin(vin);

      // ============================================================================
      // STEP 3: OPTIONAL AUDIT LOG (for debug/compliance)
      // ============================================================================
      if (process.env.LOG_LEVEL === 'debug') {
        await auditLog({
          userId,
          action: 'DECODE_VIN',
          resourceType: 'vin',
          resourceId: vin,
          metadata: {
            year: result.year,
            make: result.make,
            model: result.model
          },
          ipAddress: req.ip,
          timestamp: new Date()
        });
      }

      // ============================================================================
      // STEP 4: RETURN RESPONSE
      // ============================================================================
      return res.json(result);

    } catch (error) {
      console.error('VIN decode error:', error);
      
      return res.status(500).json({
        error: 'vin_decode_failed',
        message: 'Failed to decode VIN',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * GET /api/vin/history/:vin
 * 
 * Get valuation history for a specific VIN
 * 
 * Required auth: Authenticated user (any role)
 * 
 * Returns: Array of past valuations for this VIN (last 50)
 */
router.get(
  '/history/:vin',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { vin } = req.params;
    const userId = req.user!.userId;

    // ============================================================================
    // STEP 1: VALIDATE VIN FORMAT
    // ============================================================================
    if (!vin || vin.length < 11 || vin.length > 20) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid VIN format',
        details: 'VIN must be 11-20 characters'
      });
    }

    // ============================================================================
    // STEP 2: FETCH HISTORY FROM DATABASE
    // ============================================================================
    try {
      const result = await db.query(
        `SELECT * FROM receipts 
         WHERE vehicle_data->>'vin' = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [vin]
      );

      // ============================================================================
      // STEP 3: OPTIONAL AUDIT LOG
      // ============================================================================
      if (process.env.LOG_LEVEL === 'debug') {
        await auditLog({
          userId,
          action: 'VIEW_VIN_HISTORY',
          resourceType: 'vin',
          resourceId: vin,
          metadata: {
            resultCount: result.rows.length
          },
          ipAddress: req.ip,
          timestamp: new Date()
        });
      }

      // ============================================================================
      // STEP 4: RETURN RESPONSE
      // ============================================================================
      return res.json({
        success: true,
        vin,
        count: result.rows.length,
        data: result.rows.map((receipt) => ({
          id: receipt.id,
          userId: receipt.user_id,
          dealershipId: receipt.dealership_id,
          vehicle: receipt.vehicle_data,
          summary: receipt.summary,
          createdAt: receipt.created_at,
          updatedAt: receipt.updated_at
        }))
      });

    } catch (error) {
      console.error('VIN history fetch error:', error);
      
      return res.status(500).json({
        error: 'history_fetch_failed',
        message: 'Failed to fetch VIN history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

export default router;
