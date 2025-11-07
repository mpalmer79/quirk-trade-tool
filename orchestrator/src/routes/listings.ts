import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { getVehicleListings } from '../autodev/listings.js';

const router = Router();

/**
 * Validation schemas
 */
const ListingsSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1900).max(2100),
  trim: z.string().optional(),
  condition: z.string().optional(),
  mileage: z.number().optional()
});

/**
 * GET /api/listings
 * 
 * Get vehicle listings and market pricing for comparable vehicles
 * Used for wholesale valuation and market analysis
 * 
 * Query parameters:
 *   make (required) - Vehicle make (e.g., "Chevrolet")
 *   model (required) - Vehicle model (e.g., "Silverado")
 *   year (required) - Model year (e.g., 2020)
 *   trim (optional) - Vehicle trim (e.g., "LT")
 *   condition (optional) - Vehicle condition
 *   mileage (optional) - Current mileage for price adjustment
 * 
 * Returns: VehicleListingResult with pricing analysis and comparable listings
 */
router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Parse query parameters
    const { make, model, year, trim, condition, mileage } = req.query;

    // Validate input
    if (!make || !model || !year) {
      res.status(400).json({
        error: 'validation_error',
        message: 'Missing required parameters: make, model, year',
        required: ['make', 'model', 'year']
      });
      return;
    }

    try {
      const parsed = ListingsSchema.parse({
        make: String(make),
        model: String(model),
        year: Number(year),
        trim: trim ? String(trim) : undefined,
        condition: condition ? String(condition) : undefined,
        mileage: mileage ? Number(mileage) : undefined
      });

      // Get listings
      const result = await getVehicleListings(
        parsed.make,
        parsed.model,
        parsed.year,
        parsed.trim,
        parsed.condition,
        parsed.mileage
      );

      // Log request for audit
      console.log('Listings request', {
        userId: req.user?.userId,
        make: parsed.make,
        model: parsed.model,
        year: parsed.year,
        listingCount: result.listings?.length || 0,
        timestamp: new Date()
      });

      res.json(result);
    } catch (error) {
      console.error('Listings error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'validation_error',
          message: 'Invalid parameters',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'listings_failed',
        message: 'Failed to retrieve listings',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * POST /api/listings/compare
 * 
 * Compare specific vehicle details against market listings
 * 
 * Body:
 * {
 *   "make": "Chevrolet",
 *   "model": "Silverado",
 *   "year": 2020,
 *   "trim": "LT",
 *   "mileage": 45000,
 *   "condition": "Good"
 * }
 */
router.post(
  '/compare',
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { make, model, year, trim, mileage, condition } = req.body;

    // Validate
    if (!make || !model || !year) {
      res.status(400).json({
        error: 'validation_error',
        message: 'Missing required fields: make, model, year'
      });
      return;
    }

    try {
      const parsed = ListingsSchema.parse({
        make,
        model,
        year,
        trim,
        condition,
        mileage
      });

      const result = await getVehicleListings(
        parsed.make,
        parsed.model,
        parsed.year,
        parsed.trim,
        parsed.condition,
        parsed.mileage
      );

      // Log audit
      console.log('Listings compare request', {
        userId: req.user?.userId,
        vehicle: `${parsed.year} ${parsed.make} ${parsed.model}`,
        mileage: parsed.mileage,
        timestamp: new Date()
      });

      res.json(result);
    } catch (error) {
      console.error('Compare listings error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'validation_error',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'compare_failed',
        message: 'Failed to compare listings'
      });
    }
  })
);

export default router;
