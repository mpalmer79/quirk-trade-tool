// frontend/app/lib/providers/jdpower.ts

export interface JdBodiesRow {
  ucgvehicleid?: string | number;
  [k: string]: unknown;
}

export interface JdBodiesResponse {
  result?: JdBodiesRow[];
  [k: string]: unknown;
}

export interface JdValueRow {
  baseroughtrade?: number;
  baseaveragetrade?: number;
  basecleantrade?: number;
  basecleanretail?: number;
  [k: string]: unknown;
}

export interface JdValueResponse {
  result?: JdValueRow[];
  [k: string]: unknown;
}

export async function jdLookupUcgVehicleId(input: {
  modelyear: number;
  make: string;
  model: string;
  period?: string | number; // default "0" = current
}): Promise<string> {
  const qs = new URLSearchParams(
    Object.entries({ mode: "lookup", period: input.period ?? "0", modelyear: input.modelyear, make: input.make, model: input.model })
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`/api/jdpower?${qs.toString()}`);
  if (!res.ok) throw new Error(`JDPOWER_LOOKUP_${res.status}`);
  const data = (await res.json()) as JdBodiesResponse;
  const id = data?.result?.[0]?.ucgvehicleid;
  if (!id) throw new Error("JDPOWER_NO_UCG_ID");
  return String(id);
}

export async function jdFetchValues(input: {
  ucgvehicleid: string | number;
  mileage: number;
  region: number;
  period?: string | number;
}): Promise<JdValueRow> {
  const qs = new URLSearchParams(
    Object.entries({ mode: "value", period: input.period ?? "0", ucgvehicleid: input.ucgvehicleid, mileage: input.mileage, region: input.region })
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`/api/jdpower?${qs.toString()}`);
  if (!res.ok) throw new Error(`JDPOWER_VALUE_${res.status}`);
  const data = (await res.json()) as JdValueResponse;
  const row = data?.result?.[0];
  if (!row) throw new Error("JDPOWER_EMPTY_VALUES");
  return row;
}
