'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import ValuationForm from './components/ValuationForm';
import type { FormData, Summary } from './lib/types';

// If you later stand up the orchestrator, set this in Pages env:
// Settings → Pages → Build and deployment → Environment variables
// NEXT_PUBLIC_ORCHESTRATOR_URL=https://your-hostname-or-port
const ORCH_BASE = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || '';

export default function HomePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      condition: 3,
      options: [],
    },
    mode: 'onSubmit',
  });

  const [summary] = React.useState<Summary | null>(null);

  const onSubmit = async (values: FormData) => {
    // Always persist latest form data for the mock page
    try {
      sessionStorage.setItem(
        'mockForm',
        JSON.stringify({
          storeId: values.storeId,
          vin: values.vin,
          year: values.year,
          make: values.make,
          model: values.model,
          trim: values.trim,
          mileage: values.mileage,
          condition: values.condition,
          options: values.options ?? [],
        })
      );
    } catch {
      // no-op
    }

    // If no orchestrator URL, go straight to the mock receipt
    if (!ORCH_BASE) {
      router.push('/mock');
      return;
    }

    // Try real API; fall back to mock receipt on any failure
    try {
      const res = await fetch(`${ORCH_BASE}/api/v1/valuate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error(`orchestrator_${res.status}`);
      const data = await res.json();

      // If you later create a real receipt page, stash the response here:
      // sessionStorage.setItem('lastReceipt', JSON.stringify(data));
      // router.push('/receipt');

      // For now, still use the mock so you can print to PDF consistently
      router.push('/mock');
    } catch {
      router.push('/mock');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Vehicle Valuation</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ValuationForm
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
            watch={watch}
            setValue={setValue}
            summary={summary}
          />
        </form>
      </div>
    </main>
  );
}
