'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Calendar, Car } from 'lucide-react';
import Link from 'next/link';

interface AppraisalRecord {
  id: string;
  timestamp: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
}

export default function HistoryPage() {
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [filteredAppraisals, setFilteredAppraisals] = useState<AppraisalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Load appraisals from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('appraisal_history');
    if (stored) {
      const data = JSON.parse(stored);
      setAppraisals(data.slice(0, 300)); // Limit to 300
      setFilteredAppraisals(data.slice(0, 300));
    }
  }, []);

  // Filter appraisals when search term or filters change
  useEffect(() => {
    let filtered = appraisals;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.vin.toLowerCase().includes(term) ||
          a.make.toLowerCase().includes(term) ||
          a.model.toLowerCase().includes(term) ||
          a.year.includes(term)
      );
    }

    if (makeFilter) {
      filtered = filtered.filter((a) => a.make === makeFilter);
    }

    if (yearFilter) {
      filtered = filtered.filter((a) => a.year === yearFilter);
    }

    setFilteredAppraisals(filtered);
  }, [searchTerm, makeFilter, yearFilter, appraisals]);

  // Get unique makes and years for filters
  const uniqueMakes = Array.from(new Set(appraisals.map((a) => a.make))).sort();
  const uniqueYears = Array.from(new Set(appraisals.map((a) => a.year))).sort().reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Appraisal History</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredAppraisals.length} of {appraisals.length} appraisals
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search VIN, Make, Model, Year..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Make Filter */}
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Makes</option>
              {uniqueMakes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || makeFilter || yearFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setMakeFilter('');
                setYearFilter('');
              }}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results */}
        {filteredAppraisals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appraisals Found</h3>
            <p className="text-gray-500">
              {appraisals.length === 0
                ? 'Complete your first valuation to see it here.'
                : 'Try adjusting your search filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppraisals.map((appraisal) => (
              <div
                key={appraisal.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="grid md:grid-cols-5 gap-4 items-center">
                  {/* Vehicle Info */}
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      {appraisal.year} {appraisal.make} {appraisal.model}
                    </h3>
                    {appraisal.trim && (
                      <p className="text-sm text-gray-600">{appraisal.trim}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">VIN: {appraisal.vin || 'N/A'}</p>
                  </div>

                  {/* Mileage */}
                  <div>
                    <p className="text-sm text-gray-500">Mileage</p>
                    <p className="font-semibold text-gray-800">
                      {appraisal.mileage.toLocaleString()} mi
                    </p>
                  </div>

                  {/* Value */}
                  <div>
                    <p className="text-sm text-gray-500">Avg Value</p>
                    <p className="font-bold text-green-600 text-lg">
                      ${appraisal.averageValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${appraisal.minValue.toLocaleString()} - ${appraisal.maxValue.toLocaleString()}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(appraisal.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(appraisal.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
