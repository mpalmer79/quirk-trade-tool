import { Router } from 'express';
import { z } from 'zod';
import { decodeVin } from '../vin/index.js';

const router = Router();

const VinSchema = z.object({
  vin: z.string().min(11).max(20)
});

router.post('/decode', async (req, res) => {
  const parsed = VinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() });
  }
  try {
    const result = await decodeVin(parsed.data.vin);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: 'vin_decode_failed' });
  }
});

export default router;
