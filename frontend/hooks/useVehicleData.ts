import { useState, useEffect } from 'react';
import { filterAutomotiveMakes, filterMotorcycleMakes } from '@/utils/vehicleFilters';

export function useVehicleData() {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 1 - 1995 + 1 }, (_, i) => 1995 + i).reverse();

  useEffect(() => {
    const fetchMakes = async () => {
      setLoadingMakes(true);
      try {
        const [carsRes, motorcyclesRes, mpvRes] = await Promise.all([
          fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/passenger%20car?format=json'),
          fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/motorcycle?format=json'),
          fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/truck?format=json')
        ]);

        const [carsData, motorcyclesData, mpvData] = await Promise.all([
          carsRes.json(),
          motorcyclesRes.json(),
          mpvRes.json()
        ]);

        const allMakes = [
          ...carsData.Results.map((item: any) => item.MakeName),
          ...motorcyclesData.Results.map((item: any) => item.MakeName),
          ...mpvData.Results.map((item: any) => item.MakeName)
        ];

        const filteredMakes = filterAutomotiveMakes(allMakes);
        const motorcycleResults = filterMotorcycleMakes(motorcyclesData.Results);
        
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
      const modelNames = data.Results.map((item: any) => item.Model_Name).sort();
      setModels(modelNames);
    } catch (e) {
      console.error('Failed to fetch models:', e);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const decodeVin = async (vin: string) => {
    if (!vin || vin.length < 17) return null;
    
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      const data = await response.json();
      
      const results = data.Results;
      return {
        year: results.find((r: any) => r.Variable === "Model Year")?.Value || "",
        make: results.find((r: any) => r.Variable === "Make")?.Value || "",
        model: results.find((r: any) => r.Variable === "Model")?.Value || "",
        trim: results.find((r: any) => r.Variable === "Trim")?.Value || ""
      };
    } catch (e) {
      console.error('VIN decode failed:', e);
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
