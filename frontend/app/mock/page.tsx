
'use client';

import React from 'react';

type MockForm = {
  storeId?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  condition?: number;
  options?: string[];
};

const DEALERSHIP_BY_ID: Record<string, { name: string; city: string; state: string }> = {
  // Keep in sync with your DEALERSHIPS seed if you want nicer headers
  // These are safe fallbacks if not found in sessionStorage:
  '1': { name: 'Quirk Buick GMC', city: 'Braintree', state: 'MA' },
  '2': { name: 'Quirk Chevrolet', city: 'Braintree', state: 'MA' }
};

function computeMockValue(input: MockForm) {
  // Deterministic “ballpark” builder:
  const year = Number(input.year ?? 2018);
  const mileage = Number(input.mileage ?? 60000);
  const condition = Number(input.condition ?? 3);

  // Base by age
  const age = Math.max(0, new Date().getFullYear() - year);
  let base = 34000 - age * 1800;

  // Mileage impact
  const extraMiles = Math.max(0, mileage - 30000);
  base -= (extraMiles / 1000) * 150;

  // Condition factor
  const conditionFactor = [0, 0.78, 0.88, 1.0, 1.07, 1.12][condition] || 1.0;
  base *= conditionFactor;

  // Options bump
  const optCount = (input.options ?? []).length;
  base += optCount * 150;

  // Floor & round
  const wholesale = Math.max(2500, Math.round(base / 50) * 50);
  const retailAsk = Math.round(wholesale * 1.12 / 50) * 50;

  return {
    wholesale,
    retailAsk
  };
}

export default function MockReceiptPage() {
  const [form, setForm] = React.useState<MockForm | null>(null);
  const [store, setStore] = React.useState<{ name: string; city: string; state: string } | null>(
    null
  );
  const [values, setValues] = React.useState<{ wholesale: number; retailAsk: number } | null>(null);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('mockForm');
      const parsed = raw ? (JSON.parse(raw) as MockForm) : {};
      setForm(parsed);

      const ds =
        (parsed.storeId && DEALERSHIP_BY_ID[parsed.storeId]) ||
        DEALERSHIP_BY_ID['1'] ||
        { name: 'Quirk Auto Group', city: 'Boston', state: 'MA' };
      setStore(ds);

      setValues(computeMockValue(parsed));
    } catch {
      setForm({});
      setStore({ name: 'Quirk Auto Group', city: 'Boston', state: 'MA' });
      setValues(computeMockValue({}));
    }
  }, []);

  const printNow = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Trade-In Appraisal (Demo)</h1>
              <p className="text-sm text-gray-600">
                {store?.name} — {store?.city}, {store?.state}
              </p>
            </div>
            <button
              onClick={printNow}
              className="px-4 py-2 rounded-lg border bg-black text-white hover:bg-gray-800"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Vehicle Summary */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Vehicle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600">VIN</div>
              <div className="font-medium">{form?.vin || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Year</div>
              <div className="font-medium">{form?.year || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Make</div>
              <div className="font-medium">{form?.make || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Model</div>
              <div className="font-medium">{form?.model || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Trim</div>
              <div className="font-medium">{form?.trim || '—'}</div>
            </div>
            <div>
              <div className="text-gray-600">Mileage</div>
              <div className="font-medium">
                {form?.mileage ? Number(form.mileage).toLocaleString() : '—'}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Condition</div>
              <div className="font-medium">
                {form?.condition ? `${form.condition} / 5` : '—'}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-gray-600">Options</div>
              <div className="font-medium">
                {form?.options?.length ? form.options.join(', ') : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Estimated Values (Demo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-gray-600">Estimated Wholesale</div>
              <div className="text-2xl font-bold">
                {values ? `$${values.wholesale.toLocaleString()}` : '—'}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-gray-600">Suggested Retail Ask</div>
              <div className="text-2xl font-bold">
                {values ? `$${values.retailAsk.toLocaleString()}` : '—'}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Demo only. Final numbers may differ once market data, options, condition notes,
            and book values are applied through the orchestrator.
          </p>
        </div>
        
  );
}
