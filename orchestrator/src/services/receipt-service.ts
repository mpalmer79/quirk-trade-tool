/**
 * Receipt Service
 * 
 * Generates PDF receipts for vehicle valuations
 * Includes vehicle details, valuation breakdown, and condition analysis
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import type { ValuationResult } from '../types/valuation.types.js';

// Dealership type (inline definition to avoid import issues)
interface Dealership {
  id: string;
  name: string;
  city: string;
  state: string;
}

// Quote type for proper typing
interface SourceValuation {
  source: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  currency: string;
}

/**
 * Generate PDF receipt for a valuation
 * 
 * @param valuation - The valuation result with quotes, summary, depreciation
 * @param dealership - Dealership information
 * @returns Stream of PDF data
 */
export async function generateReceipt(
  valuation: ValuationResult,
  dealership: Dealership
): Promise<Readable> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'letter',
        margin: 40,
        bufferPages: true,
      });

      // Color scheme
      const PRIMARY_COLOR = '#001a4d';
      const ACCENT_COLOR = '#00d9a3';
      const DARK_TEXT = '#1a1a1a';
      const LIGHT_TEXT = '#666666';

      // ======================================================================
      // HEADER SECTION
      // ======================================================================
      doc.fillColor(PRIMARY_COLOR);
      doc.fontSize(28).font('Helvetica-Bold').text('VEHICLE APPRAISAL', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor(ACCENT_COLOR).text('Quirk AI Trade Valuation Tool', { align: 'center' });
      
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke(ACCENT_COLOR);
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke(ACCENT_COLOR);

      // Dealership info
      doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK_TEXT).text(dealership.name);
      doc.fontSize(9).font('Helvetica').fillColor(LIGHT_TEXT);
      doc.text(`${dealership.city}, ${dealership.state}`);
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`);
      doc.text(`Valuation ID: ${valuation.id}`);

      doc.moveDown(0.5);

      // ======================================================================
      // VEHICLE DETAILS SECTION
      // ======================================================================
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('VEHICLE INFORMATION');
      doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke(ACCENT_COLOR);
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica').fillColor(DARK_TEXT);
      
      const vehicleDetails = [
        { label: 'Year:', value: valuation.vehicle.year.toString() },
        { label: 'Make:', value: valuation.vehicle.make },
        { label: 'Model:', value: valuation.vehicle.model },
        { label: 'Trim:', value: valuation.vehicle.trim || 'N/A' },
        { label: 'Mileage:', value: valuation.vehicle.mileage.toLocaleString() + ' miles' },
        { label: 'Condition:', value: valuation.depreciation.conditionLabel || 'N/A' },
      ];

      vehicleDetails.forEach(detail => {
        doc.font('Helvetica-Bold').text(detail.label, 50, doc.y, { width: 100, continued: true });
        doc.font('Helvetica').fillColor(DARK_TEXT).text(detail.value);
      });

      doc.moveDown(0.5);

      // ======================================================================
      // VALUATION SUMMARY SECTION (HIGHLIGHTED BOX)
      // ======================================================================
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('WHOLESALE VALUATION');
      doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke(ACCENT_COLOR);
      doc.moveDown(0.3);

      // Base value box
      doc.rect(50, doc.y, 200, 60).fillAndStroke(ACCENT_COLOR, ACCENT_COLOR);
      doc.fillColor('white').fontSize(9).font('Helvetica').text('BASE WHOLESALE VALUE', 60, doc.y + 8);
      doc.fontSize(18).font('Helvetica-Bold').text(`$${valuation.baseWholesaleValue.toLocaleString()}`, 60, doc.y + 5);
      
      // Adjustment box
      const depreciationAmount = valuation.depreciation.depreciationAmount || 0;
      const depreciationPercentage = valuation.depreciation.depreciationPercentage || 0;
      
      doc.rect(270, doc.y - 60, 235, 60).fillAndStroke('#fff3e0', '#ffb74d');
      doc.fillColor('#e65100').fontSize(9).font('Helvetica').text('CONDITION ADJUSTMENT', 280, doc.y - 52);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`−$${depreciationAmount.toLocaleString()}`, 280, doc.y + 2);
      doc.fontSize(9).fillColor('#ff6f00').text(`(${depreciationPercentage.toFixed(0)}% depreciation)`, 280, doc.y + 2);

      doc.moveDown(4);

      // Final value (BIG)
      doc.rect(50, doc.y, 455, 50).fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text('FINAL TRADE-IN VALUE', 60, doc.y + 8);
      doc.fontSize(28).font('Helvetica-Bold').text(`$${valuation.finalWholesaleValue.toLocaleString()}`, 60, doc.y + 5, { align: 'center' });

      doc.moveDown(3.5);

      // ======================================================================
      // CONDITION IMPACT ANALYSIS TABLE
      // ======================================================================
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('CONDITION IMPACT ANALYSIS');
      doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke(ACCENT_COLOR);
      doc.moveDown(0.3);

      const tableTop = doc.y + 10;
      const col1 = 50;
      const col2 = 180;
      const col3 = 320;
      const col4 = 450;
      const rowHeight = 20;

      // Table header
      doc.rect(col1 - 10, tableTop, 510, rowHeight).fillAndStroke('#f5f5f5', '#ddd');
      doc.fillColor(PRIMARY_COLOR).fontSize(9).font('Helvetica-Bold');
      doc.text('Condition', col1, tableTop + 5);
      doc.text('Depreciation', col2, tableTop + 5);
      doc.text('Estimated Value', col3, tableTop + 5);
      doc.text('Your Rating', col4, tableTop + 5);

      // Table rows
      const conditions = [
        { label: '5 - Excellent', factor: 1.0, rating: 5 },
        { label: '4 - Very Good', factor: 0.95, rating: 4 },
        { label: '3 - Good', factor: 0.90, rating: 3 },
        { label: '2 - Fair', factor: 0.80, rating: 2 },
        { label: '1 - Poor', factor: 0.60, rating: 1 },
      ];

      const currentCondition = valuation.depreciation.conditionRating;

      let rowY = tableTop + rowHeight;
      conditions.forEach((condition, idx) => {
        const isSelected = condition.rating === currentCondition;
        const bgColor = isSelected ? '#e0f7f4' : (idx % 2 === 0 ? 'white' : '#fafafa');
        
        doc.rect(col1 - 10, rowY, 510, rowHeight).fillAndStroke(bgColor, '#eee');
        
        doc.fillColor(isSelected ? ACCENT_COLOR : DARK_TEXT).fontSize(9).font('Helvetica');
        doc.text(condition.label, col1, rowY + 5);
        doc.text(`${((1 - condition.factor) * 100).toFixed(0)}%`, col2, rowY + 5);
        
        const value = Math.round(valuation.baseWholesaleValue * condition.factor);
        doc.text(`$${value.toLocaleString()}`, col3, rowY + 5);
        doc.text(isSelected ? '✓ CURRENT' : '', col4, rowY + 5, { align: 'right' });
        
        rowY += rowHeight;
      });

      doc.moveDown(7);

      // ======================================================================
      // VALUATION SOURCES
      // ======================================================================
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('VALUATION SOURCES');
      doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke(ACCENT_COLOR);
      doc.moveDown(0.3);

      // Explicitly type the quotes to avoid 'any' type error
      const quotes: SourceValuation[] = valuation.quotes;
      
      quotes.forEach((quote: SourceValuation) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK_TEXT).text(quote.source, 50, doc.y);
        doc.font('Helvetica').fillColor(ACCENT_COLOR).fontSize(11).text(`$${quote.value.toLocaleString()}`, 400, doc.y - 9, { align: 'right' });
        doc.moveDown(0.4);
      });

      // Summary stats - safely access properties
      const summaryLow = valuation.quotes.reduce((min, q) => Math.min(min, q.value), Infinity);
      const summaryHigh = valuation.quotes.reduce((max, q) => Math.max(max, q.value), 0);
      const summaryAvg = valuation.quotes.reduce((sum, q) => sum + q.value, 0) / valuation.quotes.length;

      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor(LIGHT_TEXT);
      doc.text(`Average: $${Math.round(summaryAvg).toLocaleString()} | Range: $${summaryLow.toLocaleString()} - $${summaryHigh.toLocaleString()}`);

      doc.moveDown(0.8);

      // ======================================================================
      // DEPRECIATION NOTES
      // ======================================================================
      doc.fontSize(10).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('DEPRECIATION NOTES');
      doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke(ACCENT_COLOR);
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica').fillColor(LIGHT_TEXT);
      doc.text(
        `This appraisal reflects a ${depreciationPercentage.toFixed(0)}% depreciation adjustment based on the vehicle's reported condition rating of "${valuation.depreciation.conditionLabel || 'N/A'}". ` +
        `The base wholesale value of $${valuation.baseWholesaleValue.toLocaleString()} has been adjusted by $${depreciationAmount.toLocaleString()} to arrive at the final trade-in value.`,
        { align: 'justify' }
      );

      doc.moveDown(0.8);

      // ======================================================================
      // DISCLAIMER
      // ======================================================================
      doc.rect(40, doc.y, 515, 80).stroke('#ccc');
      doc.fontSize(8).font('Helvetica').fillColor(LIGHT_TEXT);
      doc.text(
        '⚠️  DISCLAIMER: This valuation is based on aggregated data from Black Book, KBB, NADA, Manheim, Quincy Auto Auction, and Auction Edge. ' +
        'Actual trade-in value may vary based on detailed inspection, market conditions, and inventory demand. ' +
        'This appraisal is valid for 24 hours from generation. Depreciation factors are applied consistently across all dealership locations. ' +
        'This valuation is intended for appraisal purposes only and should not be considered as a firm purchase offer.',
        50,
        doc.y + 5,
        { width: 505, align: 'left' }
      );

      doc.moveDown(1.5);

      // ======================================================================
      // FOOTER
      // ======================================================================
      doc.fontSize(9).font('Helvetica').fillColor(LIGHT_TEXT);
      doc.text(
        `© ${new Date().getFullYear()} Quirk Automotive Group | Powered by Quirk AI | quirkcars.com`,
        { align: 'center' }
      );

      // Finalize PDF
      doc.end();

      // Resolve with the document stream - PDFDocument extends Readable
      resolve(doc as unknown as Readable);
    } catch (error) {
      reject(error);
    }
  });
}
