/**
 * Valuation API Routes
 * 
 * POST /api/valuations/calculate - Calculate vehicle valuation with depreciation
 * GET /api/valuations/health - Health check
 * POST /api/valuations/validate-depreciation - Validate depreciation configuration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { valuationService, type ValuationRequest } from '../services/valuation-service';
import { depreciationCalculator } from '../services/depreciation-calculator';

const router = Router();

// Validation schema
const ValuationRequestSchema = z.object({
  storeId: z.string().min(1, 'storeId is required'),
  vin: z.string().optional(),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear()),
  make: z.string().min(1, 'make is required'),
  model: z.string().min(1, 'model is required'),
  trim: z.string().optional(),
  mileage: z.coerce.number().int().min(0).max(1000000),
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
 * Request body:
 * {
 *   storeId: string (required)
 *   year: number (required)
 *   make: string (required)
 *   model: string (required)
 *   trim?: string
 *   mileage: number (required)
 *   condition: 1-5 (required)
 *   options?: string[]
 *   vin?: string
 *   zip?: string
 * }
 * 
 * Response:
 * {
 *   id: string
 *   baseWholesaleValue: number
 *   depreciation: {
 *     baseWholesaleValue: number
 *     conditionRating: 1-5
 *     conditionLabel: string
 *     depreciationFactor: number (0.6-1.0)
 *     depreciationPercentage: number
 *     depreciationAmount: number
 *     finalWholesaleValue: number
 *     breakdown: { excellent, veryGood, good, fair, poor }
 *   }
 *   finalWholesaleValue: number
 *   quotes: Array<{source, value, confidence}>
 *   vehicle: {vin, year, make, model, trim, mileage}
 *   dealership: {id}
 *   timestamp: string
 * }
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    // ============================================================================
    // STEP 1: VALIDATE REQUEST
    // ============================================================================
    let payload: ValuationRequestBody;
    
    try {
      payload = ValuationRequestSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      throw error;
    }

    console.log(`📥 Valuation request received from ${payload.storeId}`);

    // ============================================================================
    // STEP 2: CREATE SERVICE REQUEST
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
    // STEP 3: CALL VALUATION SERVICE
    // ============================================================================
    const valuation = await valuationService.performValuation(valuationRequest);

    // ============================================================================
    // STEP 4: RETURN RESPONSE
    // ============================================================================
    console.log(`✅ Returning valuation to ${payload.storeId}: $${valuation.finalWholesaleValue.toLocaleString()}`);

    return res.json({
      id: valuation.id,
      baseWholesaleValue: valuation.baseWholesaleValue,
      depreciation: valuation.depreciation,
      finalWholesaleValue: valuation.finalWholesaleValue,
      quotes: valuation.quotes,
      vehicle: valuation.vehicle,
      dealership: valuation.dealership,
      timestamp: valuation.timestamp,
      _cached: valuation._cached,
    });

  } catch (error) {
    console.error('❌ Valuation calculation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('unavailable')) {
        return res.status(503).json({
          error: 'Service unavailable',
          message: 'All valuation sources are temporarily unavailable',
          suggestion: 'Try again in a few moments or contact support',
        });
      }

      if (error.message.includes('Validation')) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
      }
    }

    // Generic error response
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate valuation',
      requestId: (req as any).id || 'unknown',
    });
  }
});

/**
 * GET /api/valuations/health
 * 
 * Health check endpoint
 * Verifies that the valuation service is operational
 */
router.get('/health', (req: Request, res: Response) => {
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
});

/**
 * POST /api/valuations/validate-depreciation
 * 
 * Validate depreciation calculator configuration
 * Useful for startup checks and debugging
 * 
 * Response:
 * {
 *   valid: boolean
 *   configuration: {
 *     factors: { excellent, veryGood, good, fair, poor }
 *     conditionLabels: {...}
 *     conditionDescriptions: {...}
 *     lastUpdated: string
 *     version: string
 *   }
 *   status: string
 * }
 */
router.post('/validate-depreciation', (req: Request, res: Response) => {
  try {
    console.log('🔍 Validating depreciation configuration...');

    const isValid = depreciationCalculator.validateConfiguration();
    const config = depreciationCalculator.exportConfiguration();

    console.log(`${isValid ? '✅' : '❌'} Depreciation validation: ${isValid ? 'VALID' : 'INVALID'}`);

    return res.json({
      valid: isValid,
      configuration: config,
      status: isValid 
        ? 'Depreciation calculator is properly configured' 
        : 'Configuration error detected - see factors',
    });
  } catch (error) {
    console.error('Depreciation validation error:', error);

    return res.status(500).json({
      error: 'Validation error',
      message: 'Failed to validate depreciation configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/valuations/history/:vin
 * 
 * Get historical valuations for a specific VIN
 * 
 * Query parameters:
 * - days: number (default: 30) - How many days back to look
 * 
 * Response:
 * {
 *   vin: string
 *   valuationCount: number
 *   valuations: ValuationResult[]
 *   averageValue: number | null
 * }
 */
router.get('/history/:vin', async (req: Request, res: Response) => {
  try {
    const { vin } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!vin || vin.length < 11) {
      return res.status(400).json({
        error: 'Invalid VIN',
        message: 'VIN must be at least 11 characters',
      });
    }

    if (days < 1 || days > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 365',
      });
    }

    console.log(`📋 Retrieving valuation history for ${vin} (last ${days} days)`);

    const valuations = await valuationService.getValuationHistory(vin, days);

    const averageValue = valuations.length > 0
      ? Math.round(valuations.reduce((sum, v) => sum + v.finalWholesaleValue, 0) / valuations.length)
      : null;

    return res.json({
      vin,
      valuationCount: valuations.length,
      valuations,
      averageValue,
      periodDays: days,
    });
  } catch (error) {
    console.error('Failed to retrieve valuation history:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve valuation history',
    });
  }
});

/**
 * GET /api/valuations/statistics/:year/:make/:model
 * 
 * Get valuation statistics for a specific vehicle model
 * 
 * Query parameters:
 * - days: number (default: 30) - How many days back to analyze
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
router.get('/statistics/:year/:make/:model', async (req: Request, res: Response) => {
  try {
    const { year, make, model } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!year || !make || !model) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'year, make, and model are required',
      });
    }

    if (days < 1 || days > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter',
        message: 'Days must be between 1 and 365',
      });
    }

    console.log(`📊 Retrieving statistics for ${year} ${make} ${model} (last ${days} days)`);

    const statistics = await valuationService.getModelStatistics(
      parseInt(year),
      make,
      model,
      days
    );

    return res.json({
      year: parseInt(year),
      make,
      model,
      periodDays: days,
      statistics,
    });
  } catch (error) {
    console.error('Failed to retrieve model statistics:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve model statistics',
    });
  }
});

export default router;
