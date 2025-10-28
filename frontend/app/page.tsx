'use client';

import { useState } from 'react';
import { DollarSign, History, Car, Zap, Shield, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import ValuationForm from '@/components/ValuationForm';
import ValuationResults from '@/components/ValuationResults';

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valuation, setValuation] = useState<any>(null);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Valuation failed');
      
      const data = await response.json();
      setValuation(data);
      
      const appraisalRecord = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        vin: formData.vin || '',
        year: formData.year,
        make: formData.make,
        model: formData.model,
        trim: formData.trim || '',
        mileage: formData.mileage,
        averageValue: data.averageValue,
        minValue: data.minValue,
        maxValue: data.maxValue,
      };
      
      const existing = localStorage.getItem('appraisal_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(appraisalRecord);
      localStorage.setItem('appraisal_history', JSON.stringify(history.slice(0, 300)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Quirk Trade Tool</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-white hover:text-blue-200 transition-colors font-medium">
              Home
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white font-medium"
            >
              <History className="w-4 h-4" />
              History
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Accelerate Your Trade-In Process with
          <br />
          <span className="text-blue-200">Fast, Accurate Valuations</span>
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Get real-time vehicle valuations powered by industry-leading data providers including Black Book, KBB, NADA, and Manheim.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Zap className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Instant Results</h3>
            <p className="text-sm text-blue-100">Get valuations in seconds with our streamlined process</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Shield className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Source Data</h3>
            <p className="text-sm text-blue-100">Aggregated data from trusted industry providers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <BarChart3 className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Market Insights</h3>
            <p className="text-sm text-blue-100">See value ranges and market confidence levels</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Car className="w-10 h-10 text-blue-200 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">VIN Decode</h3>
            <p className="text-sm text-blue-100">Automatic vehicle details from VIN number</p>
          </div>
        </div>
      </div>

      {/* Valuation Form */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <ValuationForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
        {valuation && <ValuationResults valuation={valuation} />}
      </div>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-white" />
                <h3 className="text-xl font-bold text-white">Quirk Trade Tool</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Fast, accurate vehicle valuations powered by industry-leading data providers.
              </p>
            </div>
            <div className="text-right">
              <h4 className="text-white font-semibold mb-2">Contact Us</h4>
              <p className="text-blue-100 text-sm">Manchester, New Hampshire</p>
              <p className="text-blue-100 text-sm">Quirk Automotive Group</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
// ADD
import { DEALERSHIPS } from "./lib/dealerships";

// ... existing zod schema:
const FormSchema = z.object({
  storeId: z.string().min(1, "Select a dealership"),  // <— NEW
  vin: z.string().optional(),
  year: z.coerce.number().min(1990).max(new Date().getFullYear()),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional().default(""),
  mileage: z.coerce.number().int().min(0).max(1_000_000),
  condition: z.coerce.number().int().min(1).max(5),
  options: z.array(z.string()).default([]),
  zip: z.string().regex(/^\d{5}$/).optional()
});
type FormData = z.infer<typeof FormSchema>;

// in useForm defaultValues:
useForm<FormData>({
  resolver: zodResolver(FormSchema),
  defaultValues: { storeId: DEALERSHIPS[0]?.id ?? "", condition: 3, options: [] }
});

// ---------- UI: add a new Select above the VIN field ----------
<div className="mb-6">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Dealership *
  </label>
  <select
    {...register("storeId")}
    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
  >
    <option value="">Select a dealership</option>
    {DEALERSHIPS.map(d => (
      <option key={d.id} value={d.id}>{d.name}</option>
    ))}
  </select>
  {errors.storeId && (
    <p className="text-sm text-red-600 mt-1">{errors.storeId.message as string}</p>
  )}
</div>
