'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valuation, setValuation] = useState<any>(null);
  const [isDecoding, setDecoding] = useState(false);
  const [decodedMake, setDecodedMake] = useState('');
  const [decodedModel, setDecodedModel] = useState('');
  const [decodedTrim, setDecodedTrim] = useState('');

  const searchParams = useSearchParams();
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, mileage: parseInt(mileage) }),
      });
      
      if (!response.ok) throw new Error('Valuation failed');
      
      const data = await response.json();
      setValuation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onDecodeVin = async () => {
    setDecoding(true);
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      const data = await response.json();
      
      const results = data.Results;
      const decoded = {
        make: results.find((r: any) => r.Variable === "Make")?.Value || "",
        model: results.find((r: any) => r.Variable === "Model")?.Value || "",
        year: results.find((r: any) => r.Variable === "Model Year")?.Value || "",
        trim: results.find((r: any) => r.Variable === "Trim")?.Value || ""
      };
      
      if (decoded.make) setDecodedMake(decoded.make);
      if (decoded.model) setDecodedModel(decoded.model);
      if (decoded.trim) setDecodedTrim(decoded.trim);
    } catch (e) {
      alert("VIN decode failed. Try again.");
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Multi-Source Vehicle Valuation (Demo)</h1>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Demo uses simulated valuations. Real integrations with licensed providers (Black Book, KBB, NADA, Manheim) are available.
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
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <button
                type="button"
                onClick={onDecodeVin}
                disabled={!vin || vin.length < 17 || isDecoding}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isDecoding ? 'Decoding...' : 'Decode'}
              </button>
            </div>
            {decodedMake && (
              <p className="text-sm text-green-600 mt-2">
                Decoded: {decodedMake} {decodedModel} {decodedTrim}
              </p>
            )}
          </div>

          {/* Make */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
            <input
              type="text"
              value={decodedMake || make}
              onChange={(e) => setDecodedMake(e.target.value)}
              placeholder="e.g., Toyota"
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Model */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
            <input
              type="text"
              value={decodedModel || model}
              onChange={(e) => setDecodedModel(e.target.value)}
              placeholder="e.g., Camry"
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Trim */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trim (optional)</label>
            <input
              type="text"
              value={decodedTrim}
              onChange={(e) => setDecodedTrim(e.target.value)}
              placeholder="e.g., XLE"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mileage */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mileage</label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="e.g., 45000"
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isLoading ? 'Valuating...' : 'Get Multi-Source Valuation'}
          </button>
        </form>

        {valuation && (
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-green-600" />
              Valuation Results
            </h2>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Average Retail Value</p>
                  <p className="text-4xl font-bold text-green-700">
                    ${valuation.averageValue?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 mb-1">Value Range</p>
                  <p className="text-lg font-semibold text-gray-800">
                    ${valuation.minValue?.toLocaleString()} - ${valuation.maxValue?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {valuation.sources?.map((source: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{source.provider}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      source.confidence === 'high' ? 'bg-green-100 text-green-700' :
                      source.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {source.confidence} confidence
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600 mb-1">
                    ${source.value?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Retrieved {new Date(source.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Vehicle Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Vehicle Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="font-medium text-gray-800">{valuation.vehicle?.vin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Make/Model</p>
                  <p className="font-medium text-gray-800">{valuation.vehicle?.make} {valuation.vehicle?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trim</p>
                  <p className="font-medium text-gray-800">{valuation.vehicle?.trim || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                  <p className="font-medium text-gray-800">{valuation.vehicle?.mileage?.toLocaleString()} mi</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>Demo Disclaimer:</strong> This valuation uses simulated data for demonstration purposes. 
                Production integration requires API credentials and licenses from valuation providers. Values shown 
                are illustrative only and should not be used for actual transactions. Contact your provider representatives 
                for production access.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
