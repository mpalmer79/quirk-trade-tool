/**
 * Valuation API Routes
 * 
 * POST /api/valuations/calculate - Calculate vehicle valuation with depreciation
 * GET /api/valuations/health - Health check (PUBLIC)
 * POST /api/valuations/validate-depreciation - Validate depreciation (ADMIN ONLY)
 * GET /api/valuations/history/:vin - Get valuation history
 * GET /api/valuations/statistics/:year/:make/:model - Get model statistics
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { authorizationService } from '../services/authorization-service.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { auditLog } from '../middleware/logging.js';
import { valuationService } from '../services/valuation-service';
import type { ValuationRequest } from '../types/valuation.types';
import { depreciationCalculator } from '../services/depreciation-calculator.js';
import { Permission, UserRole } from '../types/user.js';

const router = Router();

// Validation schema
const ValuationRequestSchema = z.object({
  storeId: z.string().min(1, 'storeId is required'),
  vin: z.string().optional(),
  year: z.coerce.number().int().min(1995).max(new Date().getFullYear() + 1, `Year cannot be after ${new Date().getFullYear() + 1}`),
  make: z.string().min(1, 'make is required').max(50),
  model: z.string().min(1, 'model is required').max(50),
  trim: z.string().optional(),
  mileage: z.coerce.number().int().min(0).max(999999, 'Mileage cannot exceed 999,999'),
  condition: z.coerce.number().int().min(1).max(5),
  options: z.array(z.string()).optional().default([]),
  zip: z.string().regex(/^\d{5}$/).optional(),
});

type ValuationRequestBody = z.infer<typeof ValuationRequestSchema>;

/**
 * POST /api/valuations/calculate
 * 
 * Calculate vehicle valuation with multi-source aggregation and depreciation applied
 * 
 * If an Authorization header is present, we authenticate and enforce permissions
 * + dealership access. If no token is present, we allow the request to run in a
 * public/demo mode as userId "anonymous" (no permission/dealership checks).
 */
router.post(
  '/calculate',
  // Optional auth: only authenticate if a Bearer token is present.
  (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return authenticate(req, res, next);
    }
    return next();
  },
  asyncHandler(async (req: Request, res: Response) => {
    // ============================================================================ 
    // STEP 1: VALIDATE REQUEST
    // ============================================================================
    let payload: ValuationRequestBody;

    try {
      payload = ValuationRequestSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      throw error;
    }

    const isAuthenticated = !!req.user;

    // ============================================================================ 
    // STEP 2: PERMISSION & DEALERSHIP ACCESS (only when authenticated)
    // ============================================================================
    if (isAuthenticated) {
      if (!authorizationService.hasPermission(req.user!, Permission.CREATE_APPRAISAL)) {
        return res.status(403).json({
          error: 'insufficient_permissions',
          message: 'You do not have permission to calculate valuations'
        });
      }

      if (!authorizationService.canAccessDealership(req.user!, payload.storeId)) {
        return res.status(403).json({
          error: 'dealership_access_denied',
          message: `You do not have access to dealership ${payload.storeId}`
        });
      }
    }

    const userId = req.user?.userId ?? 'anonymous';
    console.log(`📥 Valuation request received from ${payload.storeId} by user ${userId}`);

    // ============================================================================ 
    // STEP 3: CREATE SERVICE REQUEST
    // ============================================================================
    const valuationRequest: ValuationRequest = {
      vin: payload.vin,
      year: payload.year,
      make: payload.make,
      model: payload.model,
      trim: payload.trim,
      mileage: payload.mileage,
      conditionRating: payload.condition as 1 | 2 | 3 | 4 | 5,
      options: payload.options,
      dealershipId: payload.storeId,
    };

    // ============================================================================ 
    // STEP 4: CALL VALUATION SERVICE
    // ============================================================================
    const valuation = await valuationService.calculateValuation(valuationRequest);

    // ============================================================================ 
    // STEP 5: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId,
      action: 'CALCULATE_VALUATION',
      resourceType: 'valuation',
      resourceId: valuation.id,
      dealershipId: payload.storeId,
      metadata: {
        vin: payload.vin || 'unknown',
        year: payload.year,
        make: payload.make,
        model: payload.model,
        mileage: payload.mileage,
        finalValue: valuation.finalWholesaleValue
      },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================ 
    // STEP 6: RETURN RESPONSE
    // ============================================================================
    console.log(`✅ Returning valuation to ${payload.storeId}: $${valuation.finalWholesaleValue.toLocaleString()}`);

    return res.json({
      id: valuation.id,
      userId,
      dealershipId: payload.storeId,
      baseWholesaleValue: valuation.baseWholesaleValue,
      depreciation: valuation.depreciation,
      finalWholesaleValue: valuation.finalWholesaleValue,
      quotes: valuation.quotes,
      vehicle: valuation.vehicle,
      dealership: valuation.dealership,
      timestamp: valuation.timestamp,
      _cached: valuation._cached,
    });

  })
);

/**
 * GET /api/valuations/health
 * 
 * Health check endpoint (PUBLIC - No auth required)
 * Verifies that the valuation service is operational
 */
router.get(
  '/health',
  (req: Request, res: Response) => {
    try {
      const config = depreciationCalculator.exportConfiguration();
      
      return res.json({
        status: 'ok',
        service: 'valuation-api',
        timestamp: new Date().toISOString(),
        depreciation: {
          factors: config.factors,
          version: config.version,
        },
      });
    } catch (error) {
      console.error('Health check failed:', error);
      return res.status(500).json({
        status: 'error',
        service: 'valuation-api',
        message: 'Health check failed',
      });
    }
  }
);

/**
 * POST /api/valuations/validate-depreciation
 * 
 * Validate depreciation calculator configuration
 * ADMIN ONLY - Used for system configuration checks
 * 
 * Required auth: Authenticated user with ADMIN role
 * 
 * Response:
 * {
 *   valid: boolean
 *   configuration: {...}
 *   status: string
 * }
 */
router.post(
  '/validate-depreciation',
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req: Request, res: Response) => {
    // ============================================================================ 
    // STEP 1: VALIDATE ADMIN ROLE
    // ============================================================================
    if (req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'admin_only',
        message: 'This endpoint is for administrators only'
      });
    }

    // ============================================================================ 
    // STEP 2: VALIDATE CONFIGURATION
    // ============================================================================
    console.log('🔍 Validating depreciation configuration...');

    const isValid = depreciationCalculator.validateConfiguration();
    const config = depreciationCalculator.exportConfiguration();

    console.log(`${isValid ? '✅' : '❌'} Depreciation validation: ${isValid ? 'VALID' : 'INVALID'}`);

    // ============================================================================ 
    // STEP 3: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId: req.user!.userId,
      action: 'VALIDATE_DEPRECIATION',
      resourceType: 'system_config',
      resourceId: 'depreciation_calculator',
      metadata: { valid: isValid },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================ 
    // STEP 4: RETURN RESPONSE
    // ============================================================================
    return res.json({
      valid: isValid,
      configuration: config,
      status: isValid 
        ? 'Depreciation calculator is properly configured' 
        : 'Configuration error detected - see factors',
    });
  })
);

/**
 * GET /api/valuations/history/:vin
 * 
 * Get historical valuations for a specific VIN
 * 
 * Required auth: Authenticated user with VIEW_APPRAISAL_HISTORY permission
 * Dealership access: User must have access to the dealership filter (query param)
 * 
 * Query parameters:
 * - days: number (default: 30) - How many days back to look
 * - dealershipId: string (required) - Filter by dealership
 * 
 * Response:
 * {
 *   vin: string
 *   valuationCount: number
 *   valuations: ValuationResult[]
 *   averageValue: number | null
 * }
 */
router.get(
  '/history/:vin',
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req: Request, res: Response) => {
    // ============================================================================ 
    // STEP 1: VALIDATE PERMISSION
    // ============================================================================
    if (!authorizationService.hasPermission(req.user!, Permission.VIEW_APPRAISAL_HISTORY)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'You do not have permission to view appraisal history'
      });
    }

    // ============================================================================ 
    // STEP 2: VALIDATE PARAMETERS
    // ============================================================================
    const { vin } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const dealershipId = req.query.dealershipId as string;

    if (!vin || vin.length < 11) {
      return res.status(400).json({
        error: 'invalid_vin',
        message: 'VIN must be at least 11 characters',
      });
    }

    if (days < 1 || days > 365) {
      return res.status(400).json({
        error: 'invalid_days',
        message: 'Days must be between 1 and 365',
      });
    }

    if (!dealershipId) {
      return res.status(400).json({
        error: 'missing_dealership',
        message: 'dealershipId query parameter is required',
      });
    }

    // ============================================================================ 
    // STEP 3: VALIDATE DEALERSHIP ACCESS
    // ============================================================================
    if (!authorizationService.canAccessDealership(req.user!, dealershipId)) {
      return res.status(403).json({
        error: 'dealership_access_denied',
        message: `You do not have access to dealership ${dealershipId}`
      });
    }

    const userId = req.user!.userId;
    console.log(`📋 Retrieving valuation history for ${vin} (last ${days} days) by user ${userId}`);

    // ============================================================================ 
    // STEP 4: RETRIEVE HISTORY
    // ============================================================================
    const valuations = await valuationService.getValuationHistory(vin, days, dealershipId);

    // ============================================================================ 
    // STEP 5: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId,
      action: 'VIEW_VALUATION_HISTORY',
      resourceType: 'valuation_history',
      resourceId: vin,
      dealershipId,
      metadata: { days, count: valuations.length },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================ 
    // STEP 6: CALCULATE AVERAGE
    // ============================================================================
    const averageValue = valuations.length > 0
      ? Math.round(valuations.reduce((sum, v) => sum + v.finalWholesaleValue, 0) / valuations.length)
      : null;

    // ============================================================================ 
    // STEP 7: RETURN RESPONSE
    // ============================================================================
    return res.json({
      vin,
      dealershipId,
      valuationCount: valuations.length,
      valuations,
      averageValue,
      periodDays: days,
    });
  })
);

/**
 * GET /api/valuations/statistics/:year/:make/:model
 * 
 * Get valuation statistics for a specific vehicle model
 * 
 * Required auth: Authenticated user with VIEW_DEALERSHIP_REPORTS permission
 * Dealership access: User must have access to the dealership filter (query param)
 * 
 * Query parameters:
 * - days: number (default: 30) - How many days back to analyze
 * - dealershipId: string (required) - Filter by dealership
 * 
 * Response:
 * {
 *   year: number
 *   make: string
 *   model: string
 *   statistics: {
 *     totalAppraisals: number
 *     averageValue: number
 *     minValue: number
 *     maxValue: number
 *     avgCondition: number
 *     lastUpdated: string
 *   }
 * }
 */
router.get(
  '/statistics/:year/:make/:model',
  authenticate,                                    // ← Verify JWT token
  asyncHandler(async (req: Request, res: Response) => {
    // ============================================================================ 
    // STEP 1: VALIDATE PERMISSION
    // ============================================================================
    if (!authorizationService.hasPermission(req.user!, Permission.VIEW_DEALERSHIP_REPORTS)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'You do not have permission to view reports'
      });
    }

    // ============================================================================ 
    // STEP 2: VALIDATE PARAMETERS
    // ============================================================================
    const { year, make, model } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const dealershipId = req.query.dealershipId as string;

    if (!year || !make || !model) {
      return res.status(400).json({
        error: 'invalid_parameters',
        message: 'year, make, and model are required',
      });
    }

    if (days < 1 || days > 365) {
      return res.status(400).json({
        error: 'invalid_days',
        message: 'Days must be between 1 and 365',
      });
    }

    if (!dealershipId) {
      return res.status(400).json({
        error: 'missing_dealership',
        message: 'dealershipId query parameter is required',
      });
    }

    // ============================================================================ 
    // STEP 3: VALIDATE DEALERSHIP ACCESS
    // ============================================================================
    if (!authorizationService.canAccessDealership(req.user!, dealershipId)) {
      return res.status(403).json({
        error: 'dealership_access_denied',
        message: `You do not have access to dealership ${dealershipId}`
      });
    }

    const userId = req.user!.userId;
    console.log(`📊 Retrieving statistics for ${year} ${make} ${model} (last ${days} days) by user ${userId}`);

    // ============================================================================ 
    // STEP 4: RETRIEVE STATISTICS
    // ============================================================================
    const statistics = await valuationService.getModelStatistics(
      parseInt(year),
      make,
      model,
      days,
      dealershipId
    );

    // ============================================================================ 
    // STEP 5: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId,
      action: 'VIEW_STATISTICS',
      resourceType: 'model_statistics',
      resourceId: `${year}/${make}/${model}`,
      dealershipId,
      metadata: { days },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================ 
    // STEP 6: RETURN RESPONSE
    // ============================================================================
    return res.json({
      year: parseInt(year),
      make,
      model,
      dealershipId,
      periodDays: days,
      statistics,
    });
  })
);

export default router;
