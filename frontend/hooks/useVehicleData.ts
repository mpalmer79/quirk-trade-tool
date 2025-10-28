import { useState, useEffect } from 'react';
import { filterAutomotiveMakes, filterMotorcycleMakes } from '@/utils/vehicleFilters';

type DecodedVin = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  engine?: { cylinders?: string; displacementL?: string };
  driveType?: string;
  fuelTypePrimary?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim();

export function useVehicleData() {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Years from 1995..currentYear (descending)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1995 + 1 },
    (_, i) => 1995 + i
  ).reverse();

  useEffect(() => {
    const fetchMakes = async () => {
      setLoadingMakes(true);
      try {
        const [carsRes, motorcyclesRes, trucksRes] = await Promise.all([
          fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/passenger%20car?format=json'),
          fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/motorcycle?format=json'),
          fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/truck?format=json')
        ]);

        const [carsData, motorcyclesData, trucksData] = await Promise.all([
          carsRes.json(),
          motorcyclesRes.json(),
          trucksRes.json()
        ]);

        const allMakes = [
          ...carsData?.Results?.map((item: any) => item.MakeName) ?? [],
          ...motorcyclesData?.Results?.map((item: any) => item.MakeName) ?? [],
          ...trucksData?.Results?.map((item: any) => item.MakeName) ?? []
        ];

        const filteredMakes = filterAutomotiveMakes(allMakes);
        const motorcycleResults = filterMotorcycleMakes(motorcyclesData?.Results ?? []);

        const finalMakes = [...new Set([...filteredMakes, ...motorcycleResults])];
        const sortedMakes = Array.from(finalMakes).sort();
        setMakes(sortedMakes);
      } catch (e) {
        console.error('Failed to fetch makes:', e);
      } finally {
        setLoadingMakes(false);
      }
    };

    fetchMakes();
  }, []);

  const fetchModels = async (make: string, year: string) => {
    if (!make || !year) {
      setModels([]);
      return;
    }

    setLoadingModels(true);
    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
      );
      const data = await response.json();
      const modelNames = (data?.Results ?? [])
        .map((item: any) => item.Model_Name)
        .filter(Boolean)
        .sort();
      setModels(modelNames);
    } catch (e) {
      console.error('Failed to fetch models:', e);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  /**
   * Decode VIN:
   * 1) Try your orchestrator (if NEXT_PUBLIC_API_BASE is set)
   * 2) Fallback to VPIC "DecodeVinValuesExtended" (browser-friendly CORS)
   */
  const decodeVin = async (vin: string): Promise<DecodedVin | null> => {
    const cleaned = (vin || '').trim().toUpperCase();
    // VPIC can decode partials; allow 11+ like your UI, but ignore obviously short inputs
    if (cleaned.length < 11) return null;

    // 1) Orchestrator path (if configured & reachable)
    if (API_BASE) {
      try {
        const r = await fetch(`${API_BASE}/api/vin/decode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vin: cleaned })
        });
        if (r.ok) {
          const json = await r.json();
          // Expecting { year, make, model, trim, ... }
          return json as DecodedVin;
        }
      } catch (e) {
        // Fall through to VPIC
        console.warn('Orchestrator VIN decode failed, falling back to VPIC:', e);
      }
    }

    // 2) Public VPIC fallback (works on GitHub Pages)
    try {
      const vpic = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(
          cleaned
        )}?format=json`
      );
      if (!vpic.ok) return null;
      const data = await vpic.json();
      const row = data?.Results?.[0];
      if (!row) return null;

      return {
        year: Number(row.ModelYear) || undefined,
        make: row.Make || undefined,
        model: row.Model || undefined,
        trim: row.Trim || undefined,
        bodyClass: row.BodyClass || undefined,
        engine: {
          cylinders: row.EngineCylinders || undefined,
          displacementL: row.DisplacementL || undefined
        },
        driveType: row.DriveType || undefined,
        fuelTypePrimary: row.FuelTypePrimary || undefined
      };
    } catch (e) {
      console.error('VIN decode (VPIC) failed:', e);
      return null;
    }
  };

  return {
    makes,
    models,
    years,
    loadingMakes,
    loadingModels,
    fetchModels,
    decodeVin
  };
}
