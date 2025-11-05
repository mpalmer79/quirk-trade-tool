import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { auditLog } from '../middleware/logging.js';
import { decodeVin } from '../vin/index.js';
import { db } from '../db/index.js';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file upload (memory storage for CSV processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * Validation schema for QAA CSV row
 */
const QaaRowSchema = z.object({
  date: z.string(), // Will be parsed to Date
  vin: z.string().min(11).max(17),
  sale_price: z.number().positive()
});

/**
 * Clean and normalize VIN
 */
function normalizeVin(vin: string): string {
  return vin.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

/**
 * Parse date string to Date object
 * Supports: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY, etc.
 */
function parseDate(dateStr: string): Date | null {
  // Try ISO format first (YYYY-MM-DD)
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try US format (MM/DD/YYYY or M/D/YYYY)
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Parse sale price from string
 * Handles: "$12,500", "12500", "12,500.00"
 */
function parseSalePrice(priceStr: string): number | null {
  // Remove currency symbols, commas, and spaces
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  
  if (isNaN(price) || price <= 0) {
    return null;
  }
  
  return Math.round(price); // Round to nearest dollar
}

/**
 * POST /api/qaa/import
 * 
 * Import QAA auction data from CSV file
 * 
 * Required auth: Admin user only
 * Required: CSV file with columns: date, vin, sale_price
 * 
 * CSV Format Examples:
 * - date,vin,sale_price
 * - 2024-11-01,1HGCV41JXMN109186,12500
 * - 11/01/2024,1HGCV41JXMN109186,$12,500
 * 
 * Returns: Import summary with success/failure counts
 */
router.post(
  '/import',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // ============================================================================
    // STEP 1: AUTHORIZATION CHECK (Admin only)
    // ============================================================================
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only administrators can import QAA auction data'
      });
    }

    // ============================================================================
    // STEP 2: VALIDATE FILE UPLOAD
    // ============================================================================
    if (!req.file) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'No CSV file uploaded'
      });
    }

    const filename = req.file.originalname;
    const batchId = uuidv4();

    console.log(`📥 Starting QAA import batch ${batchId} from file: ${filename}`);

    // ============================================================================
    // STEP 3: PARSE CSV FILE
    // ============================================================================
    let records: any[];
    try {
      const csvContent = req.file.buffer.toString('utf-8');
      
      records = parse(csvContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        cast: false, // Keep everything as strings initially
        relax_column_count: true // Allow varying column counts
      });

      if (records.length === 0) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'CSV file is empty or has no data rows'
        });
      }

      console.log(`📊 Parsed ${records.length} rows from CSV`);
    } catch (error) {
      console.error('CSV parsing error:', error);
      return res.status(400).json({
        error: 'csv_parse_error',
        message: 'Failed to parse CSV file',
        details: error instanceof Error ? error.message : 'Invalid CSV format'
      });
    }

    // ============================================================================
    // STEP 4: PROCESS ROWS WITH VIN DECODING
    // ============================================================================
    const results = {
      total: records.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; vin: string; error: string }>
    };

    const processedData: Array<{
      saleDate: Date;
      salePrice: number;
      vin: string;
      year: number;
      make: string;
      model: string;
      trim?: string;
    }> = [];

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2; // +2 because row 1 is headers, and we're 0-indexed
      const record = records[i];

      try {
        // Extract and normalize fields (support various column name formats)
        const dateField = record.date || record.Date || record.DATE || record.sale_date || record.Sale_Date;
        const vinField = record.vin || record.VIN || record.Vin;
        const priceField = record.sale_price || record.Sale_Price || record.price || record.Price;

        if (!dateField || !vinField || !priceField) {
          throw new Error('Missing required fields (date, vin, or sale_price)');
        }

        // Parse date
        const saleDate = parseDate(dateField);
        if (!saleDate) {
          throw new Error(`Invalid date format: ${dateField}`);
        }

        // Parse price
        const salePrice = parseSalePrice(priceField);
        if (!salePrice) {
          throw new Error(`Invalid sale price: ${priceField}`);
        }

        // Normalize VIN
        const vin = normalizeVin(vinField);
        if (vin.length < 11 || vin.length > 17) {
          throw new Error(`Invalid VIN length: ${vin}`);
        }

        // Decode VIN to get vehicle details
        console.log(`🔍 Decoding VIN ${vin}...`);
        const decoded = await decodeVin(vin);

        if (decoded.errors && decoded.errors.length > 0) {
          throw new Error(`VIN decode failed: ${decoded.errors.join(', ')}`);
        }

        if (!decoded.year || !decoded.make || !decoded.model) {
          throw new Error('VIN decode incomplete: missing year, make, or model');
        }

        // Success! Add to processed data
        processedData.push({
          saleDate,
          salePrice,
          vin,
          year: decoded.year,
          make: decoded.make,
          model: decoded.model,
          trim: decoded.trim
        });

        results.successful++;
        console.log(`✅ Row ${rowNum}: ${decoded.year} ${decoded.make} ${decoded.model} - $${salePrice}`);

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          row: rowNum,
          vin: record.vin || 'unknown',
          error: errorMsg
        });
        console.error(`❌ Row ${rowNum} failed: ${errorMsg}`);
      }
    }

    // ============================================================================
    // STEP 5: INSERT DATA INTO DATABASE
    // ============================================================================
    if (processedData.length > 0) {
      try {
        // Begin transaction
        await db.query('BEGIN');

        // Insert all processed records
        for (const data of processedData) {
          await db.query(
            `INSERT INTO qaa_auction_data 
             (sale_date, sale_price, vin, year, make, model, trim, import_batch_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              data.saleDate,
              data.salePrice * 100, // Store in cents
              data.vin,
              data.year,
              data.make,
              data.model,
              data.trim || null,
              batchId
            ]
          );
        }

        // Log the import
        await db.query(
          `INSERT INTO qaa_import_logs 
           (batch_id, filename, total_rows, successful_rows, failed_rows, errors, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            batchId,
            filename,
            results.total,
            results.successful,
            results.failed,
            JSON.stringify(results.errors),
            userId
          ]
        );

        // Commit transaction
        await db.query('COMMIT');

        console.log(`✅ Successfully imported ${results.successful} records`);

      } catch (error) {
        // Rollback on error
        await db.query('ROLLBACK');
        console.error('Database insert error:', error);
        
        return res.status(500).json({
          error: 'database_error',
          message: 'Failed to save auction data to database',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // ============================================================================
    // STEP 6: AUDIT LOG
    // ============================================================================
    await auditLog({
      userId,
      action: 'IMPORT_QAA_DATA',
      resourceType: 'qaa_auction_data',
      resourceId: batchId,
      metadata: {
        filename,
        totalRows: results.total,
        successfulRows: results.successful,
        failedRows: results.failed
      },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // ============================================================================
    // STEP 7: RETURN RESPONSE
    // ============================================================================
    return res.json({
      success: true,
      batchId,
      summary: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        imported: processedData.length
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 20) : undefined, // Return first 20 errors
      message: `Successfully imported ${results.successful} of ${results.total} records`
    });
  })
);

/**
 * GET /api/qaa/stats
 * 
 * Get statistics about QAA auction data
 * 
 * Required auth: Admin user only
 * 
 * Returns: Statistics about imported auction data
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const userRole = req.user!.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only administrators can view QAA statistics'
      });
    }

    // Get statistics
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT vin) as unique_vins,
        COUNT(DISTINCT make) as unique_makes,
        MIN(sale_date) as earliest_sale,
        MAX(sale_date) as latest_sale,
        AVG(sale_price) / 100 as avg_sale_price,
        MIN(sale_price) / 100 as min_sale_price,
        MAX(sale_price) / 100 as max_sale_price
      FROM qaa_auction_data
    `);

    const importLogsResult = await db.query(`
      SELECT 
        COUNT(*) as total_imports,
        SUM(successful_rows) as total_imported,
        SUM(failed_rows) as total_failed,
        MAX(created_at) as last_import
      FROM qaa_import_logs
    `);

    return res.json({
      success: true,
      auctionData: statsResult.rows[0],
      imports: importLogsResult.rows[0]
    });
  })
);

/**
 * GET /api/qaa/history
 * 
 * Get recent import history
 * 
 * Required auth: Admin user only
 * 
 * Returns: Array of recent imports
 */
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const userRole = req.user!.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only administrators can view import history'
      });
    }

    const result = await db.query(`
      SELECT 
        il.*,
        u.name as user_name,
        u.email as user_email
      FROM qaa_import_logs il
      LEFT JOIN users u ON il.user_id = u.id
      ORDER BY il.created_at DESC
      LIMIT 50
    `);

    return res.json({
      success: true,
      imports: result.rows
    });
  })
);

export default router;
