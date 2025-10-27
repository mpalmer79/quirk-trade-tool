'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, TrendingUp, History, Car, Zap, Shield, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  const [vin, setVin] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [mileage, setMileage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valuation, setValuation] = useState<any>(null);
  const [isDecoding, setDecoding] = useState(false);
  
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 1 - 1995 + 1 }, (_, i) => 1995 + i).reverse();

  // Fetch automotive and select motorcycle makes only
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

        // Combine all makes
        const allMakes = [
          ...carsData.Results.map((item: any) => item.MakeName),
          ...motorcyclesData.Results.map((item: any) => item.MakeName),
          ...mpvData.Results.map((item: any) => item.MakeName)
        ];

        // Filter out non-automotive manufacturers
        const filteredMakes = allMakes.filter((make: string) => {
          const makeLower = make.toLowerCase();
          
          // Exclude obvious non-automotive terms
          const excludeTerms = [
            'custom', 'kustom', 'trailer', 'trailers', 'cart', 'carts',
            'coach', 'manufacturing', 'enterprises', 'industries',
            'specialty', 'conversions', 'motorhomes', 'rv',
            'golf', 'utility', 'off', 'llc', 'inc', 'ltd',
            'chopper', 'cycles', 'street', 'performance',
            'fabrication', 'design', 'concepts', 'creations'
          ];
          
          // Check if make contains any exclude terms
          const shouldExclude = excludeTerms.some(term => {
            // Exclude if term is the whole word or a significant part
            return makeLower.includes(term) && 
                   (makeLower === term || 
                    makeLower.startsWith(term + ' ') || 
                    makeLower.endsWith(' ' + term) ||
                    makeLower.includes(' ' + term + ' '));
          });
          
          if (shouldExclude) return false;
          
          // Exclude makes that are just numbers or very short
          if (makeLower.length < 3) return false;
          if (/^\d+$/.test(makeLower)) return false;
          
          return true;
        });

        // Whitelist of motorcycle brands we want to keep
        const motorcycleBrands = ['harley-davidson', 'indian', 'harley davidson'];
        
        // Get final list: filtered automotive + select motorcycles
        const motorcycleResults = motorcyclesData.Results
          .map((item: any) => item.MakeName)
          .filter((make: string) => 
            motorcycleBrands.some(brand => 
              make.toLowerCase().includes(brand)
            )
          );
        
        // Combine filtered automotive with select motorcycles
        const finalMakes = [...new Set([...filteredMakes, ...motorcycleResults])];
        
        // Sort and set
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

  useEffect(() => {
    if (make && year) {
      const fetchModels = async () => {
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
      fetchModels();
    } else {
      setModels([]);
    }
  }, [make, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, year, make, model, trim, mileage: parseInt(mileage) }),
      });
      
      if (!response.ok) throw new Error('Valuation failed');
      
      const data = await response.json();
      setValuation(data);
      
      const appraisalRecord = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        vin: vin || '',
        year,
        make,
        model,
        trim: trim || '',
        mileage: parseInt(mileage),
        averageValue: data.averageValue,
        minValue: data.minValue,
        maxValue: data.maxValue,
      };
      
      const existing = localStorage.getItem('appraisal_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(appraisalRecord);
      localStorage.setItem('appraisal_history', JSON.stringify(history.slice(0, 300)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onDecodeVin = async () => {
    if (!vin || vin.length < 17) return;
    
    setDecoding(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      const data = await response.json();
      
      const results = data.Results;
      const decoded = {
        year: results.find((r: any) => r.Variable === "Model Year")?.Value || "",
        make: results.find((r: any) => r.Variable === "Make")?.Value || "",
        model: results.find((r: any) => r.Variable === "Model")?.Value || "",
        trim: results.find((r: any) => r.Variable === "Trim")?.Value || ""
      };
      
      if (decoded.year) setYear(decoded.year);
      if (decoded.make) setMake(decoded.make);
      if (decoded.model) setModel(decoded.model);
      if (decoded.trim) setTrim(decoded.trim);
    } catch (e) {
      alert("VIN decode failed. Try again.");
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Quirk Trade Tool</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-white hover:text-blue-200 transition-colors font-medium">
              Home
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white font-medium"
            >
              <History className="w-4 h-4" />
              History
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Accelerate Your Trade-In Process with
          <br />
          <span className="text-blue-200">Fast, Accurate Valuations</span>
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Get real-time vehicle valuations powered by industry-leading data providers including Black Book, KBB, NADA, and Manheim.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Zap className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Instant Results</h3>
            <p className="text-sm text-blue-100">Get valuations in seconds with our streamlined process</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Shield className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Source Data</h3>
            <p className="text-sm text-blue-100">Aggregated data from trusted industry providers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <BarChart3 className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Market Insights</h3>
            <p className="text-sm text-blue-100">See value ranges and market confidence levels</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Car className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">VIN Decode</h3>
            <p className="text-sm text-blue-100">Automatic vehicle details from VIN number</p>
          </div>
        </div>
      </div>

      {/* Valuation Form */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="w-10 h-10 text-blue-600" />
            <h3 className="text-3xl font-bold text-gray-800">Get Vehicle Valuation</h3>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                This demo uses simulated valuations. Production version integrates with licensed providers (Black Book, KBB, NADA, Manheim).
              </p>
            </div>
          </div>

          {/* VIN + Decode */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">VIN (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="e.g., 1G1ZT62812F113456"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
              <button
                type="button"
                onClick={onDecodeVin}
                disabled={!vin || vin.length < 17 || isDecoding}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isDecoding ? 'Decoding...' : 'Decode'}
              </button>
            </div>
            {year && make && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                ✓ Decoded: {year} {make} {model} {trim}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Make */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Make *</label>
              <select
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setModel('');
                }}
                required
                disabled={loadingMakes}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
              >
                <option value="">{loadingMakes ? 'Loading...' : 'Select Make'}</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                disabled={!make || !year || loadingModels}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
              >
                <option value="">
                  {!make || !year ? 'Select year & make first' : loadingModels ? 'Loading...' : 'Select Model'}
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mileage *</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="e.g., 45000"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Trim */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trim (optional)</label>
            <input
              type="text"
              value={trim}
              onChange={(e) => setTrim(e.target.value)}
              placeholder="e.g., XLE, Sport, Limited"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'Getting Valuation...' : 'Get Multi-Source Valuation'}
          </button>
        </form>

        {valuation && (
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-8 md:p-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              Valuation Results
            </h2>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 mb-8 border-2 border-green-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Average Retail Value</p>
                  <p className="text-5xl font-bold text-green-700">
                    ${valuation.averageValue?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Value Range</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${valuation.minValue?.toLocaleString()} - ${valuation.maxValue?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {valuation.sources?.map((source: any, idx: number) => (
                <div key={idx} className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-800">{source.provider}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      source.confidence === 'high' ? 'bg-green-100 text-green-700' :
                      source.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {source.confidence} confidence
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-2">
                    ${source.value?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Retrieved {new Date(source.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Vehicle Info */}
            <div className="border-t-2 pt-6">
              <h3 className="font-bold text-xl text-gray-800 mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">VIN</p>
                  <p className="font-semibold text-gray-800">{valuation.vehicle?.vin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">Vehicle</p>
                  <p className="font-semibold text-gray-800">{valuation.vehicle?.year} {valuation.vehicle?.make} {valuation.vehicle?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">Trim</p>
                  <p className="font-semibold text-gray-800">{valuation.vehicle?.trim || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 font-medium">Mileage</p>
                  <p className="font-semibold text-gray-800">{valuation.vehicle?.mileage?.toLocaleString()} mi</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>Demo Disclaimer:</strong> This valuation uses simulated data for demonstration purposes. 
                Production integration requires API credentials and licenses from valuation providers. Values shown 
                are illustrative only and should not be used for actual transactions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-white" />
                <h3 className="text-xl font-bold text-white">Quirk Trade Tool</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Fast, accurate vehicle valuations powered by industry-leading data providers.
              </p>
            </div>
            <div className="text-right">
              <h4 className="text-white font-semibold mb-2">Contact Us</h4>
              <p className="text-blue-100 text-sm">Manchester, New Hampshire</p>
              <p className="text-blue-100 text-sm">Quirk Automotive Group</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
