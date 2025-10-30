import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';  // ← ADD THIS LINE

export type AppraisalReceipt = {
  id: string;
  createdAt: string;
  input: Record<string, unknown>;
  quotes: { source: string; value: number }[];
  summary: { low: number; high: number; avg: number; confidence: string };
  provenance: { sources: string[]; simulated: boolean; region?: string };
};

export async function saveReceipt(receipt: AppraisalReceipt) {
  const dir = join(process.cwd(), env.RECEIPTS_DIR);  // ← CHANGE THIS LINE
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${receipt.id}.json`);
  await writeFile(file, JSON.stringify(receipt, null, 2), 'utf8');
  return file;
}

export function newReceiptId() {
  return `apr_${nanoid(12)}`;
}
