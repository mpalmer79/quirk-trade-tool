import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import type { SourceQuote, Summary, DepreciationData } from '../lib/types';
import { getPdfReceiptUrl } from '../lib/api';

type ResultsSectionProps = {
  quotes: SourceQuote[];
  summary: Summary;
  depreciation: DepreciationData;
  lastId: string | null;
  condition: number;
};

const conditionLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

export function ResultsSection({ quotes, summary, depreciation, lastId, condition }: ResultsSectionProps) {
  return (
    <div id="results-section" className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* MAIN VALUATION CARD WITH DEPRECIATION */}
        <div className="bg-gradient-to-br from-[#001a4d] to-[#003d99] rounded-2xl shadow-2xl p-10 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#00d9a3] bg-opacity-20 p-3 rounded-lg">
              <DollarSign className="w-8 h-8 text-[#00d9a3]" />
            </div>
            <h2 className="text-3xl font-bold">Estimated Trade-In Value</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Base Value */}
            <div>
              <p className="text-gray-300 text-sm font-semibold mb-2 uppercase tracking-wide">Base Wholesale Value</p>
              <p className="text-4xl font-bold text-gray-100 mb-2">
                ${summary.base.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">From multi-source aggregation</p>
            </div>

            {/* Depreciation Applied */}
            <div className="border-l border-[#00d9a3] border-opacity-30 pl-8">
              <p className="text-gray-300 text-sm font-semibold mb-2 uppercase tracking-wide">
                Condition Adjustment ({depreciation.conditionLabel})
              </p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-red-300">−${depreciation.depreciationAmount.toLocaleString()}</span>
                <span className="text-[#00d9a3] font-bold">({depreciation.depreciationPercentage.toFixed(0)}%)</span>
              </div>
              <p className="text-xs text-gray-400">Based on condition rating</p>
            </div>
          </div>

          {/* FINAL VALUE - EMPHASIZED */}
          <div className="border-t-2 border-[#00d9a3] border-opacity-30 pt-8">
            <p className="text-[#00d9a3] text-sm font-bold mb-3 uppercase tracking-widest">Final Wholesale Value</p>
            <p className="text-6xl font-bold mb-4">${depreciation.finalWholesaleValue.toLocaleString()}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Confidence Level: <span className="text-[#00d9a3] font-semibold">{summary.confidence}</span></span>
              <span className="text-gray-300">Source Range: <span className="text-[#00d9a3] font-semibold">${summary.low.toLocaleString()} - ${summary.high.toLocaleString()}</span></span>
            </div>
          </div>
        </div>

        {/* DEPRECIATION BREAKDOWN TABLE */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Condition Impact Analysis</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            How different condition ratings affect the base wholesale value of <strong>${summary.base.toLocaleString()}</strong>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4 font-bold text-gray-800">Condition Rating</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-800">Depreciation %</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-800">Estimated Value</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-800">vs. Your Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '5 - Excellent', factor: 1.0, rating: 5 },
                  { label: '4 - Very Good', factor: 0.95, rating: 4 },
                  { label: '3 - Good', factor: 0.90, rating: 3 },
                  { label: '2 - Fair', factor: 0.80, rating: 2 },
                  { label: '1 - Poor', factor: 0.60, rating: 1 },
                ].map((row) => {
                  const value = Math.round(summary.base * row.factor);
                  const diff = value - depreciation.finalWholesaleValue;
                  const selected = row.rating === condition;
                  
                  return (
                    <tr 
                      key={row.rating}
                      className={`border-b ${
                        selected 
                          ? 'bg-[#00d9a3] bg-opacity-10 border-[#00d9a3]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-4 px-4 font-semibold text-gray-800">
                        {row.label}
                        {selected && <span className="ml-2 text-[#00d9a3] font-bold">← Current</span>}
                      </td>
                      <td className="text-center py-4 px-4 text-gray-700 font-semibold">
                        {((1 - row.factor) * 100).toFixed(0)}%
                      </td>
                      <td className="text-right py-4 px-4 text-gray-800 font-bold">
                        ${value.toLocaleString()}
                      </td>
                      <td className="text-right py-4 px-4 font-semibold">
                        {diff === 0 ? (
                          <span className="text-[#00d9a3]">—</span>
                        ) : diff > 0 ? (
                          <span className="text-green-600">+${diff.toLocaleString()}</span>
                        ) : (
                          <span className="text-red-600">−${Math.abs(diff).toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-900">
              <strong>💡 Sales Tip:</strong> A detailed inspection could improve condition rating from {conditionLabels[condition]} to {conditionLabels[Math.min(condition + 1, 5)]}, potentially increasing value by <strong>${Math.round(summary.base * (0.05 * Math.min(condition + 1, 5) - condition * 0.05)).toLocaleString()}</strong>.
            </p>
          </div>
        </div>

        {/* SOURCES BREAKDOWN */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#00d9a3] bg-opacity-10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#00d9a3]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Valuation Sources</h3>
            </div>
            {lastId && (
              <a href={getPdfReceiptUrl(lastId)} target="_blank" rel="noreferrer" className="px-6 py-3 bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-semibold rounded-lg transition-all flex items-center gap-2">
                Download PDF <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((q, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-[#00d9a3] hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00d9a3] flex-shrink-0" />
                  <span className="font-semibold text-gray-800">{q.source}</span>
                </div>
                <span className="text-xl font-bold text-[#00d9a3]">${q.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="bg-[#fff8e6] border-l-4 border-[#ff9800] rounded-lg p-6">
          <p className="text-gray-800 text-sm">
            <strong>✓ Powered by Quirk AI</strong> – Real-time integration with Black Book, KBB, NADA, Manheim, Quincy Auto Auction, and Auction Edge. 
            Depreciation factors are applied consistently across all dealership locations. This valuation is valid for appraisal purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
