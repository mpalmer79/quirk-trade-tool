import { TrendingUp } from 'lucide-react';

interface ValuationResultsProps {
  valuation: any;
}

export default function ValuationResults({ valuation }: ValuationResultsProps) {
  return (
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
  );
}
