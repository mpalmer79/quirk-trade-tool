// frontend/app/receipt/[id]/page.tsx
import React from 'react';
import { getPdfReceiptUrl } from '@/app/lib/api';

// Mark this route as fully dynamic (no static export errors)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { id: string } };

async function fetchSummary(id: string) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ||
    'http://localhost:4000';
  const res = await fetch(`${base}/api/valuations/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load valuation');
  return res.json();
}

export default async function ReceiptPage({ params }: Props) {
  const data = await fetchSummary(params.id);
  const pdfUrl = getPdfReceiptUrl(params.id);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade-In Appraisal</h1>
        <a
          href={pdfUrl}
          className="px-4 py-2 rounded-lg border bg-black text-white hover:bg-gray-800"
        >
          Download PDF
        </a>
      </div>

      <section className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Vehicle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-600">Year</div>
            <div className="font-medium">
              {data?.summary?.year ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Make</div>
            <div className="font-medium">
              {data?.summary?.make ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Model</div>
            <div className="font-medium">
              {data?.summary?.model ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Trim</div>
            <div className="font-medium">
              {data?.summary?.trim ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Body Style</div>
            <div className="font-medium">
              {data?.summary?.bodyStyle ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Mileage</div>
            <div className="font-medium">
              {data?.summary?.mileage
                ? data.summary.mileage.toLocaleString()
                : '—'}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Estimated Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-600">Base Value</div>
            <div className="text-2xl font-bold">
              ${data?.summary?.base?.toLocaleString?.() ?? '—'}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-600">Adjusted Value</div>
            <div className="text-2xl font-bold">
              ${data?.summary?.avg?.toLocaleString?.() ?? '—'}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Figures subject to final reconditioning/market checks.
        </p>
      </section>
    </div>
  );
}
