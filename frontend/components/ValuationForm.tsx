'use client';

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { useVehicleData } from '@/hooks/useVehicleData';

interface ValuationFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ValuationForm({ onSubmit, isLoading, error }: ValuationFormProps) {
  const [vin, setVin] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [mileage, setMileage] = useState('');
  const [isDecoding, setDecoding] = useState(false);

  const { makes, models, years, loadingMakes, loadingModels, fetchModels, decodeVin } = useVehicleData();

  // Auto-fetch models when make and year change
  useEffect(() => {
    fetchModels(make, year);
  }, [make, year]);

  // Auto-decode VIN when input changes (11+ characters)
  useEffect(() => {
    if (vin.length >= 11) {
      const autoDecodeVin = async () => {
        setDecoding(true);
        const decoded = await decodeVin(vin);
        if (decoded) {
          if (decoded.year) setYear(decoded.year.toString());
          if (decoded.make) setMake(decoded.make);
          if (decoded.model) setModel(decoded.model);
          if (decoded.trim) setTrim(decoded.trim);
        }
        setDecoding(false);
      };
      autoDecodeVin();
    }
  }, [vin, decodeVin]);

  const handleDecodeVin = async () => {
    setDecoding(true);
    const decoded = await decodeVin(vin);
    if (decoded) {
      if (decoded.year) setYear(decoded.year.toString());
      if (decoded.make) setMake(decoded.make);
      if (decoded.model) setModel(decoded.model);
      if (decoded.trim) setTrim(decoded.trim);
    } else {
      alert("VIN decode failed. Try again.");
    }
    setDecoding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcode ZIP to 02122 (Boston, MA - Dorchester)
    onSubmit({ 
      vin, 
      year, 
      make, 
      model, 
      trim, 
      mileage: parseInt(mileage),
      zip: "02122"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
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
            onClick={handleDecodeVin}
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
  );
}
