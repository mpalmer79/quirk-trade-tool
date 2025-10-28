"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import type { SourceQuote, Summary } from "@lib/types";

type Props = {
  apiBase: string;
  appraisalId: string | null;
  quotes: SourceQuote[] | null;
  summary: Summary | null;
};

export default function ValuationResults({ apiBase, appraisalId, quotes, summary }: Props) {
  if (!quotes || !summary) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Estimated Wholesale Value</h2>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold mb-2">
            ${summary.low.toLocaleString()} - ${summary.high.toLocaleString()}
          </p>
          <p className="text-indigo-100">
            Average: ${summary.avg.toLocaleString()} · Confidence: {summary.confidence}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Source Breakdown (Simulated)</h3>
          {!!appraisalId && (
            <a
              className="text-sm font-semibold px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              href={`${apiBase}/api/receipt/pdf/${appraisalId}`}
              target="_blank" rel="noreferrer"
            >
              Download PDF
            </a>
          )}
        </div>
        <div className="space-y-3">
          {quotes.map((q, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
              <span className="font-medium text-gray-700">{q.source}</span>
              <span className="text-lg font-bold text-indigo-600">${q.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Demo tool. Real provider quotes require licensed integrations and may differ materially.
        </p>
      </div>
    </div>
  );
}
