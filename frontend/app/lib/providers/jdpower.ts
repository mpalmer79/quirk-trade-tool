// frontend/app/lib/providers/jdpower.ts
// Client-side helper that calls your Netlify Function at /api/jdpower.
// No secrets live here; the function uses env vars on the server.

export interface JdPowerValueRow {
  baseroughtrade?: number;
  baseaveragetrade?: number;
  basecleantrade?: number;
  basecleanretail?: number;
  // include any other fields you care about from JD Power’s response
}

export interface JdPowerResponse {
  result?: JdPowerValueRow[]; // typical JD Power shape
  [k: string]: unknown;
}

export async function fetchJdPowerValue(params: {
  ucgvehicleid: string | number;
  mileage: number;
  region: number;
  // allow custom period if you add it later
  period?: string | number;
}): Promise<JdPowerValueRow> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );

  const res = await fetch(`/api/jdpower?${qs.toString()}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`JDPOWER_HTTP_${res.status} ${text}`);
  }

  const json = (await res.json()) as JdPowerResponse;
  const row = json?.result?.[0];
  if (!row) throw new Error('JDPOWER_EMPTY_RESULT');
  return row;
}
