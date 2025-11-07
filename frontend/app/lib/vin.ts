export type DecodedVin = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  engine?: { cylinders?: string; displacementL?: string };
  driveType?: string;
  fuelTypePrimary?: string;
};

export async function decodeVinClientOnly(vin: string): Promise<DecodedVin | null> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(
    vin
  )}?format=json`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) return null;

  const data = await res.json();
  const row = data?.Results?.[0];
  if (!row) return null;

  // Build a list of possible fields NHTSA may use for model information and pick the first useful one.
  const candidateFields = [
    row.Model,
    row.ModelName,
    row.MakeModel,
    row.ModelVariantDescription,
    row.Series,
    row.Trim,
    row.VehicleType,
  ];

  function normalize(v: any) {
    if (v === undefined || v === null) return '';
    return v.toString().trim();
  }

  let model = candidateFields.map(normalize).find((s) => !!s) || undefined;

  // Guard against placeholder or numeric-only model values; if found, try additional fallbacks
  if (model && /^[0-9\-\s]+$/.test(model)) {
    const fallback = (row.Series ?? row.Trim ?? row.ModelVariantDescription ?? '').toString().trim();
    model = fallback || undefined;
  }

  // Extract trim with fallbacks: Trim → Series → ModelVariantDescription
  const trim =
    (row.Trim ?? '').toString().trim() ||
    (row.Series ?? '').toString().trim() ||
    (row.ModelVariantDescription ?? '').toString().trim() ||
    undefined;

  return {
    year: Number(row.ModelYear) || undefined,
    make: (row.Make ?? '').toString().trim() || undefined,
    model,
    trim,
    bodyClass: (row.BodyClass ?? '').toString().trim() || undefined,
    engine: {
      cylinders: (row.EngineCylinders ?? '').toString().trim() || undefined,
      displacementL: (row.DisplacementL ?? '').toString().trim() || undefined,
    },
    driveType: (row.DriveType ?? '').toString().trim() || undefined,
    fuelTypePrimary: (row.FuelTypePrimary ?? '').toString().trim() || undefined,
  };
}

// Backwards-compatible alias: some modules import `decodeVin` from this file.
export const decodeVin = decodeVinClientOnly;
