import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { AppraisalReceipt } from './receipts.js';

export async function generateReceiptPdf(receipt: AppraisalReceipt) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // Letter portrait
  const { width } = page.getSize();

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const title = 'Quirk Auto Dealers — Appraisal Receipt';
  page.drawText(title, {
    x: 40,
    y: 740,
    size: 18,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.6)
  });

  const meta = `ID: ${receipt.id}
Created: ${new Date(receipt.createdAt).toLocaleString()}`;

  page.drawText(meta, {
    x: 40, y: 710, size: 10, font
  });

  // Vehicle & input section
  page.drawText('Vehicle Input', { x: 40, y: 680, size: 12, font: fontBold });
  const inputLines = [
    `Year: ${receipt.input['year'] ?? ''}`,
    `Make: ${receipt.input['make'] ?? ''}`,
    `Model: ${receipt.input['model'] ?? ''}`,
    `Trim: ${receipt.input['trim'] ?? ''}`,
    `Mileage: ${receipt.input['mileage'] ?? ''}`,
    `Condition: ${receipt.input['condition'] ?? ''}`,
    `Options: ${(Array.isArray(receipt.input['options']) ? receipt.input['options'] : []).join(', ') || '-'}`,
    `ZIP: ${receipt.input['zip'] ?? ''}`
  ];
  page.drawText(inputLines.join('\n'), { x: 40, y: 660, size: 10, font, lineHeight: 14 });

  // Quotes table header
  page.drawText('Source Quotes (USD)', { x: 40, y: 540, size: 12, font: fontBold });
  const qStartY = 520;
  page.drawText('Source', { x: 40, y: qStartY, size: 10, font: fontBold });
  page.drawText('Value', { x: width - 140, y: qStartY, size: 10, font: fontBold });

  let y = qStartY - 18;
  for (const q of receipt.quotes) {
    page.drawText(q.source, { x: 40, y, size: 10, font });
    page.drawText(`$${q.value.toLocaleString()}`, { x: width - 160, y, size: 10, font });
    y -= 16;
  }

  // Summary
  y -= 10;
  page.drawText('Summary', { x: 40, y, size: 12, font: fontBold });
  y -= 18;
  const s = receipt.summary;
  page.drawText(`Range: $${s.low.toLocaleString()} — $${s.high.toLocaleString()}`, { x: 40, y, size: 10, font });
  y -= 14;
  page.drawText(`Average: $${s.avg.toLocaleString()}     Confidence: ${s.confidence}`, { x: 40, y, size: 10, font });

  // Footer note
  page.drawText('Note: Demo values from simulated providers. Licensed data integrations required for production.', {
    x: 40, y: 60, size: 9, font, color: rgb(0.4, 0.4, 0.4)
  });

  const bytes = await pdf.save();
  return bytes;
}
