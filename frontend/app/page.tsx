'use client';

/**
 * Quirk Trade Tool - Main Landing Page
 * 
 * ARCHITECTURE NOTE:
 * This file is now a lightweight orchestrator that delegates to focused components:
 * - Hero: Header and branding (app/components/Hero.tsx)
 * - ValuationForm: All form fields and VIN decoding (app/components/ValuationForm.tsx)
 * - ResultsSection: Valuation results display (app/components/ResultsSection.tsx)
 * - FeaturesSection: Marketing content (app/components/FeaturesSection.tsx)
 * 
 * This structure improves:
 * - Maintainability: Each component has a single responsibility
 * - Testability: Components can be tested in isolation
 * - Reusability: Components can be used elsewhere
 * - Readability: Main page is ~150 lines vs 700+
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormData, SourceQuote, Summary, DepreciationData } from './lib/types';
import { FormSchema } from './lib/types';
import { calculateValuation } from './lib/api';
import { DEALERSHIPS } from './dealerships';
import { Hero } from './components/Hero';
import { ValuationForm } from './components/ValuationForm';
import { ResultsSection } from './components/ResultsSection';
import { FeaturesSection } from './components/FeaturesSection';

export default function Page() {
  // Form handling
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { 
      storeId: DEALERSHIPS[0]?.id ?? '', 
      condition: 3, 
      options: [] 
    }
  });

  // State management
  const [quotes, setQuotes] = React.useState<SourceQuote[] | null>(null);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [depreciation, setDepreciation] = React.useState<DepreciationData | null>(null);
  const [lastId, setLastId] = React.useState<string | null>(null);

  // Watch form values
  const condition = watch('condition');

  // Form submission handler
  const onSubmit = async (data: FormData) => {
    try {
      const result = await calculateValuation(data);
      
      setQuotes(result.quotes);
      setSummary({
        low: Math.min(...result.quotes.map((q: SourceQuote) => q.value)),
        high: Math.max(...result.quotes.map((q: SourceQuote) => q.value)),
        avg: Math.round(result.quotes.reduce((sum: number, q: SourceQuote) => sum + q.value, 0) / result.quotes.length),
        confidence: result.summary?.confidence || 'High',
        base: result.baseWholesaleValue,
        depreciation: result.depreciation,
      });
      setDepreciation(result.depreciation);
      setLastId(result.id);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Valuation error:', error);
      alert(error instanceof Error ? error.message : 'Error calculating valuation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <Hero />

      {/* Form Section */}
      <div className="relative -mt-1 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <form onSubmit={handleSubmit(onSubmit)}>
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
      </div>

      {/* Results Section */}
      {summary && quotes && depreciation && (
        <ResultsSection 
          quotes={quotes}
          summary={summary}
          depreciation={depreciation}
          lastId={lastId}
          condition={condition}
        />
      )}

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}
