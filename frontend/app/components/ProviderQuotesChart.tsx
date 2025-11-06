'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ProviderQuote {
  source: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
}

interface ProviderQuotesChartProps {
  quotes: ProviderQuote[];
}

const CONFIDENCE_COLORS = {
  high: '#10b981',    // green
  medium: '#f59e0b',  // amber
  low: '#ef4444',     // red
};

export function ProviderQuotesChart({ quotes }: ProviderQuotesChartProps) {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Provider Quotes</h3>
        <div className="text-center text-gray-500 py-8">
          No provider quotes available
        </div>
      </div>
    );
  }

  const data = quotes.map(q => ({
    name: q.source,
    value: q.value,
    confidence: q.confidence,
    fill: CONFIDENCE_COLORS[q.confidence],
  }));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Provider Quotes Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Quote']}
            contentStyle={{ fontSize: '14px' }}
          />
          <Legend />
          <Bar dataKey="value" name="Quote Value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>High Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span>Medium Confidence</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Low Confidence</span>
        </div>
      </div>
    </div>
  );
}
