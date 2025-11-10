'use client';

import React, { useState } from 'react';
import { jdLookupUcgVehicleId, jdFetchValues } from './lib/providers/jdpower';

export default function JDPowerTestPage() {
  const [year, setYear] = useState('2022');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [mileage, setMileage] = useState('30000');
  const [region, setRegion] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  const [ucgId, setUcgId] = useState('');

  const testLookup = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const id = await jdLookupUcgVehicleId({
        modelyear: parseInt(year),
        make: make,
        model: model
      });
      
      setUcgId(id);
      setResults({ ucgVehicleId: id });
    } catch (err: any) {
      setError(`Lookup Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testValuation = async () => {
    if (!ucgId) {
      setError('Please run lookup first to get UCG Vehicle ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const values = await jdFetchValues({
        ucgvehicleid: ucgId,
        mileage: parseInt(mileage),
        region: parseInt(region)
      });
      
      setResults({
        ucgVehicleId: ucgId,
        values: values,
        formatted: {
          roughTrade: values.baseroughtrade ? `$${values.baseroughtrade.toLocaleString()}` : 'N/A',
          averageTrade: values.baseaveragetrade ? `$${values.baseaveragetrade.toLocaleString()}` : 'N/A',
          cleanTrade: values.basecleantrade ? `$${values.basecleantrade.toLocaleString()}` : 'N/A',
          cleanRetail: values.basecleanretail ? `$${values.basecleanretail.toLocaleString()}` : 'N/A'
        }
      });
    } catch (err: any) {
      setError(`Valuation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFullFlow = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      // Step 1: Lookup
      const id = await jdLookupUcgVehicleId({
        modelyear: parseInt(year),
        make: make,
        model: model
      });
      
      setUcgId(id);
      
      // Step 2: Get Values
      const values = await jdFetchValues({
        ucgvehicleid: id,
        mileage: parseInt(mileage),
        region: parseInt(region)
      });
      
      setResults({
        ucgVehicleId: id,
        rawValues: values,
        formatted: {
          roughTrade: values.baseroughtrade ? `$${values.baseroughtrade.toLocaleString()}` : 'N/A',
          averageTrade: values.baseaveragetrade ? `$${values.baseaveragetrade.toLocaleString()}` : 'N/A',
          cleanTrade: values.basecleantrade ? `$${values.basecleantrade.toLocaleString()}` : 'N/A',
          cleanRetail: values.basecleanretail ? `$${values.basecleanretail.toLocaleString()}` : 'N/A'
        }
      });
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">JD Power API Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mileage</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="1">Northeast</option>
                <option value="2">Southeast</option>
                <option value="3">Midwest</option>
                <option value="4">Southwest</option>
                <option value="5">West</option>
              </select>
            </div>
            
            {ucgId && (
              <div>
                <label className="block text-sm font-medium mb-2">UCG Vehicle ID</label>
                <input
                  type="text"
                  value={ucgId}
                  readOnly
                  className="w-full p-2 border rounded bg-gray-100"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testLookup}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              1. Test Lookup
            </button>
            
            <button
              onClick={testValuation}
              disabled={loading || !ucgId}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              2. Test Valuation
            </button>
            
            <button
              onClick={testFullFlow}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              Test Full Flow
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
            Loading...
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {results.ucgVehicleId && (
              <div className="mb-4">
                <strong>UCG Vehicle ID:</strong> {results.ucgVehicleId}
              </div>
            )}
            
            {results.formatted && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Rough Trade</div>
                  <div className="text-2xl font-bold text-red-600">{results.formatted.roughTrade}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Average Trade</div>
                  <div className="text-2xl font-bold text-yellow-600">{results.formatted.averageTrade}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Clean Trade</div>
                  <div className="text-2xl font-bold text-green-600">{results.formatted.cleanTrade}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Clean Retail</div>
                  <div className="text-2xl font-bold text-blue-600">{results.formatted.cleanRetail}</div>
                </div>
              </div>
            )}
            
            {results.rawValues && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">Raw Response</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(results.rawValues, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-semibold mb-2">⚠️ API Key Configuration</h3>
          <p className="text-sm">
            For this to work, you need to set the <code className="bg-gray-200 px-1">JDPOWER_API_KEY</code> environment variable in Netlify:
          </p>
          <ol className="list-decimal list-inside text-sm mt-2">
            <li>Go to Netlify Dashboard → Site Settings → Environment Variables</li>
            <li>Add variable: <code className="bg-gray-200 px-1">JDPOWER_API_KEY</code> = your API key</li>
            <li>Optionally add: <code className="bg-gray-200 px-1">JDPOWER_BASE_URL</code> if using custom endpoint</li>
            <li>Redeploy your site</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
