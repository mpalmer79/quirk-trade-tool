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

  // Extract model
  const model = (row.Model ?? '').toString().trim() || undefined;

  // Extract trim with fallbacks: Trim → Series → ModelVariantDescription
  const trim =
    (row.Trim ?? '').toString().trim() ||
    (row.Series ?? '').toString().trim() ||
    (row.ModelVariantDescription ?? '').toString().trim() ||
    undefined;

  return {
    year: Number(row.ModelYear) || undefined,
    make: row.Make || undefined,
    model,
    trim,
    bodyClass: row.BodyClass || undefined,
    engine: {
      cylinders: row.EngineCylinders || undefined,
      displacementL: row.DisplacementL || undefined,
    },
    driveType: row.DriveType || undefined,
    fuelTypePrimary: row.FuelTypePrimary || undefined,
  };
}
