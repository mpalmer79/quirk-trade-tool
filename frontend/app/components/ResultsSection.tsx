import React from 'react';

type Depreciation = {
  depreciationFactor: number;
  conditionRating: number;
  finalWholesaleValue: number;
  conditionLabel?: string;
};

type Summary = {
  base: number;
  low: number;
  high: number;
  avg: number;
  confidence: 'High' | 'Medium' | 'Low' | 'Very Low';
  depreciation?: Depreciation;
};

type ResultsSectionProps = {
  summary: Summary | null;
  quotes?: any;
  depreciation?: any;
  lastId?: string | null;
  condition?: number;
};

export const ResultsSection: React.FC<ResultsSectionProps> = ({ summary }) => {
  // CRITICAL FIX: Early return for null summary
  if (!summary) {
    return null;
  }

  // CRITICAL FIX: Safe depreciation access with defaults
  const depreciation = summary.depreciation || {
    conditionRating: 3,
    depreciationFactor: 0.9,
    finalWholesaleValue: Math.round(summary.base * 0.9),
  };

  // CRITICAL FIX: Safe conditionLabel access
  const conditionLabel = depreciation.conditionLabel || 'Good';

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Valuation Results</h2>
      
      {/* Base Wholesale Value */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Base Wholesale Value:</span>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(summary.base)}</span>
        </div>
      </div>

      {/* Condition Information */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-md font-medium text-gray-700">Vehicle Condition:</span>
          <span className="text-lg font-semibold text-gray-800">{conditionLabel}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">Depreciation Factor:</span>
          <span className="text-md text-gray-700">{(depreciation.depreciationFactor * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Final Wholesale Value */}
      <div className="mb-4 p-4 bg-green-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Final Wholesale Value:</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(depreciation.finalWholesaleValue)}</span>
        </div>
      </div>

      {/* Value Range */}
      <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
        <div className="text-center">
          <span className="text-md text-gray-700">Value Range: </span>
          <span className="font-semibold text-gray-800">
            {formatCurrency(summary.low)} - {formatCurrency(summary.high)}
          </span>
        </div>
      </div>

      {/* Confidence Level */}
      <div className="mb-4 p-4 bg-purple-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-md font-medium text-gray-700">Confidence Level:</span>
          <span className={`text-lg font-semibold ${
            summary.confidence === 'High' ? 'text-green-600' :
            summary.confidence === 'Medium' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {summary.confidence}
          </span>
        </div>
      </div>

      {/* Average Value */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-md font-medium text-gray-700">Average Market Value:</span>
          <span className="text-lg font-semibold text-gray-800">{formatCurrency(summary.avg)}</span>
        </div>
      </div>
    </div>
  );
};
