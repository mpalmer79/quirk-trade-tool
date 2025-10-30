import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { auditLog } from '../middleware/logging.js';
import { decodeVin } from '../vin/index.js';

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
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req, res) => {
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
      // Only log at debug level to reduce audit trail noise for high-volume operations
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

export default router;
