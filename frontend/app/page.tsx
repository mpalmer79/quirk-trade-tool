'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertCircle, ScanLine, 
  CheckCircle2, ArrowRight, Info 
} from 'lucide-react';
import { DEALERSHIPS } from './dealerships';
import type { Dealership } from '@/app/lib/types';

const FormSchema = z.object({
  storeId: z.string().min(1, 'Select a dealership'),
  vin: z.string().optional(),
  year: z.coerce.number().min(1990).max(new Date().getFullYear()),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional().default(''),
  mileage: z.coerce.number().int().min(0).max(1_000_000),
  condition: z.coerce.number().int().min(1).max(5),
  options: z.array(z.string()).default([]),
  zip: z.string().regex(/^\d{5}$/).optional()
});
type FormData = z.infer<typeof FormSchema>;

// ✅ NEW: Depreciation data type
type DepreciationData = {
  baseWholesaleValue: number;
  conditionRating: number;
  conditionLabel: string;
  depreciationFactor: number;
  depreciationPercentage: number;
  depreciationAmount: number;
  finalWholesaleValue: number;
  breakdown: {
    excellent: number;
    veryGood: number;
    good: number;
    fair: number;
    poor: number;
  };
};

type SourceQuote = { source: string; value: number };
type Summary = { 
  low: number; 
  high: number; 
  avg: number; 
  confidence: string;
  base: number;  // ✅ NEW
  depreciation: DepreciationData;  // ✅ NEW
};
type AppraiseResponse = { 
  id: string; 
  quotes: SourceQuote[]; 
  summary: Summary; 
  store?: Dealership; 
  note?: string;
  depreciation: DepreciationData;  // ✅ NEW
};

type DecodedVin = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
};

const makes = ['Acura','Audi','BMW','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC','Honda','Hyundai','Jeep','Kia','Lexus','Mazda','Mercedes-Benz','Nissan','Ram','Subaru','Tesla','Toyota','Volkswagen','Volvo'];

const modelsByMake: Record<string, string[]> = {
  Acura: ['ILX','Integra','TLX','MDX','RDX','NSX'],
  Audi: ['A3','A4','A5','A6','A7','A8','Q3','Q5','Q7','Q8','e-tron','R8','TT'],
  BMW: ['2 Series','3 Series','4 Series','5 Series','7 Series','X1','X3','X5','X7','i4','iX'],
  Cadillac: ['CT4','CT5','Escalade','XT4','XT5','XT6','Lyriq'],
  Chevrolet: ['Blazer','Camaro','Colorado','Corvette','Equinox','Malibu','Silverado','Suburban','Tahoe','Trailblazer','Traverse','Trax'],
  Chrysler: ['300','Pacifica'],
  Dodge: ['Challenger','Charger','Durango','Hornet'],
  Ford: ['Bronco','Bronco Sport','Edge','Escape','Expedition','Explorer','F-150','F-250','F-350','Maverick','Mustang','Ranger'],
  GMC: ['Acadia','Canyon','Sierra 1500','Sierra 2500','Sierra 3500','Terrain','Yukon','Yukon XL'],
  Honda: ['Accord','Civic','CR-V','HR-V','Odyssey','Passport','Pilot','Ridgeline'],
  Hyundai: ['Elantra','Sonata','Tucson','Santa Fe','Palisade','Kona','Venue','Ioniq 5','Ioniq 6'],
  Jeep: ['Cherokee','Compass','Gladiator','Grand Cherokee','Grand Wagoneer','Renegade','Wagoneer','Wrangler'],
  Kia: ['Forte','K5','Sportage','Sorento','Telluride','Seltos','Soul','EV6','Carnival'],
  Lexus: ['ES','IS','LS','GX','LX','NX','RX','UX','TX'],
  Mazda: ['Mazda3','Mazda6','CX-30','CX-5','CX-50','CX-9','CX-90','MX-5 Miata'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','S-Class','GLA','GLB','GLC','GLE','GLS','EQB','EQE','EQS'],
  Nissan: ['Altima','Maxima','Sentra','Versa','Ariya','Kicks','Rogue','Murano','Pathfinder','Armada','Frontier','Titan','Z'],
  Ram: ['1500','2500','3500','ProMaster'],
  Subaru: ['Impreza','Legacy','Outback','Crosstrek','Forester','Ascent','WRX','BRZ','Solterra'],
  Tesla: ['Model 3','Model S','Model X','Model Y'],
  Toyota: ['Camry','Corolla','Avalon','Prius','RAV4','Highlander','4Runner','Sequoia','Tacoma','Tundra','Sienna','bZ4X','GR86','Supra'],
  Volkswagen: ['Jetta','Passat','Arteon','Taos','Tiguan','Atlas','ID.4','Golf GTI'],
  Volvo: ['S60','S90','V60','V90','XC40','XC60','XC90','C40']
};

const optionsList = ['Navigation System','Sunroof/Moonroof','Leather Seats','Premium Sound System','Third Row Seating','All-Wheel Drive','Adaptive Cruise Control','Heated Seats','Backup Camera','Towing Package'];

const conditionDescriptions: Record<number, string> = {
  1: 'Poor - Significant damage, needs major repairs',
  2: 'Fair - Visible wear, minor damage, functional',
  3: 'Good - Normal wear, clean, well-maintained',
  4: 'Very Good - Minimal wear, excellent condition',
  5: 'Excellent - Like new, pristine condition'
};

const conditionLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

async function decodeVinWithNhtsa(vin: string): Promise<DecodedVin | null> {
  const cleaned = (vin || '').trim().toUpperCase();
  if (cleaned.length < 11) return null;

  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(cleaned)}?format=json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const row = data?.Results?.[0];
    if (!row) return null;

    let make = row.Make || undefined;
    if (make) {
      make = make
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    let model = row.Model || undefined;
    if (model) {
      model = model
        .split('-')
        .map((part: string) => 
          part
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        )
        .join('-');
    }

    return {
      year: Number(row.ModelYear) || undefined,
      make: make,
      model: model,
      trim: row.Trim || undefined,
    };
  } catch (e) {
    console.error('VIN decode failed:', e);
    return null;
  }
}

const WaveDivider = () => (
  <svg className="w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 Q300,10 600,50 T1200,50 L1200,120 L0,120 Z" fill="white" />
  </svg>
);

export default function Page() {
  const currentYear = new Date().getFullYear();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { storeId: DEALERSHIPS[0]?.id ?? '', condition: 3, options: [] }
  });

  const make = watch('make');
  const condition = watch('condition');
  const vin = watch('vin');

  const [decoding, setDecoding] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<DecodedVin | null>(null);
  const [quotes, setQuotes] = React.useState<SourceQuote[] | null>(null);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [depreciation, setDepreciation] = React.useState<DepreciationData | null>(null);  // ✅ NEW
  const [lastId, setLastId] = React.useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const handleDecodeVin = async () => {
    setDecoding(true);
    const decoded = await decodeVinWithNhtsa(vin);
    if (decoded) {
      if (decoded.year) setValue('year', decoded.year);
      if (decoded.make) setValue('make', decoded.make);
      if (decoded.model) setValue('model', decoded.model);
      if (decoded.trim) setValue('trim', decoded.trim);
    } else {
      alert("VIN decode failed. Please enter vehicle details manually.");
    }
    setDecoding(false);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        storeId: data.storeId,
        year: parseInt(data.year.toString()),
        make: data.make,
        model: data.model,
        trim: data.trim || undefined,
        mileage: parseInt(data.mileage.toString()),
        condition: parseInt(data.condition.toString()),
        vin: data.vin || undefined,
        options: data.options,
        zip: data.zip || undefined,
      };

      const response = await fetch(`${API_BASE}/api/valuations/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Valuation failed');
      }

      const result = await response.json();
      
      setQuotes(result.quotes);
      setSummary({
        low: Math.min(...result.quotes.map((q: SourceQuote) => q.value)),
        high: Math.max(...result.quotes.map((q: SourceQuote) => q.value)),
        avg: Math.round(result.quotes.reduce((sum: number, q: SourceQuote) => sum + q.value, 0) / result.quotes.length),
        confidence: result.summary.confidence || 'High',
        base: result.baseWholesaleValue,  // ✅ NEW
        depreciation: result.depreciation,  // ✅ NEW
      });
      setDepreciation(result.depreciation);  // ✅ NEW
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
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-[#001a4d] to-[#003d99] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d9a3] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00d9a3] rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-6">
            <ScanLine className="w-10 h-10 text-[#00d9a3]" />
            <span className="text-[#00d9a3] font-semibold text-sm tracking-widest uppercase">Trade Valuation Tool</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Get Instant Wholesale Valuations
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mb-8">
            Real-time vehicle appraisals powered by Black Book, KBB, NADA, Manheim, and more. Accurate, transparent pricing with condition-based adjustments.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
              <span>Multi-source accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
              <span>Real-time data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
              <span>VIN decoding</span>
            </div>
          </div>
        </div>

        <WaveDivider />
      </div>

      {/* FORM SECTION */}
      <div className="relative -mt-1 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Dealership Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Dealership Location *</label>
              <select {...register('storeId')} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800">
                {DEALERSHIPS.map(d => <option key={d.id} value={d.id}>{d.name} ({d.city}, {d.state})</option>)}
              </select>
              {errors.storeId && <p className="text-red-600 text-sm mt-2">{errors.storeId.message as string}</p>}
            </div>

            {/* VIN Decode Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">VIN (optional) - Auto-fill vehicle details</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  {...register('vin')} 
                  placeholder="e.g., 1G1ZT62812F113456" 
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] uppercase"
                  maxLength={17}
                />
                <button 
                  type="button"
                  onClick={handleDecodeVin}
                  disabled={!vin || vin.length < 17 || decoding}
                  className="px-6 py-3 bg-[#00d9a3] hover:bg-[#00b87d] text-gray-900 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {decoding ? 'Decoding...' : 'Decode'}
                </button>
              </div>
              {vin && vin.length === 17 && (
                <p className="text-sm text-green-600 mt-2 font-medium">✓ Valid VIN format</p>
              )}
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Year *</label>
                <select {...register('year')} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800">
                  <option value="">Select Year</option>
                  {Array.from({length: currentYear - 1989}, (_, i) => currentYear - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.year && <p className="text-red-600 text-sm mt-2">{errors.year.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Make *</label>
                <select {...register('make')} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800">
                  <option value="">Select Make</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.make && <p className="text-red-600 text-sm mt-2">{errors.make.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Model *</label>
                <select {...register('model')} disabled={!watch('make')} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500">
                  <option value="">{watch('make') ? 'Select Model' : 'Select Make First'}</option>
                  {(watch('make') ? (modelsByMake[watch('make')!] || []) : []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.model && <p className="text-red-600 text-sm mt-2">{errors.model.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Trim (optional)</label>
                <input {...register('trim')} placeholder="e.g., LE, Sport, Limited" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-3">Mileage *</label>
                <input type="number" {...register('mileage')} placeholder="Enter mileage" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800" />
                {errors.mileage && <p className="text-red-600 text-sm mt-2">{errors.mileage.message as string}</p>}
              </div>
            </div>

            {/* ✅ NEW: CONDITION SLIDER - UPDATED */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <label className="block text-sm font-semibold text-gray-800">
                  Vehicle Condition: <span className="text-[#00d9a3] text-lg">{conditionLabels[condition]}</span>
                </label>
              </div>
              
              <input 
                type="range" 
                min={1} 
                max={5} 
                {...register('condition')} 
                className="w-full h-3 bg-gray-300 rounded-lg accent-[#00d9a3] cursor-pointer"
              />
              
              <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
                <span>Poor (1)</span>
                <span>Fair (2)</span>
                <span>Good (3)</span>
                <span>Very Good (4)</span>
                <span>Excellent (5)</span>
              </div>
              
              <p className="text-sm text-gray-700 mt-4 italic font-medium">
                📋 {conditionDescriptions[Number(condition) || 3]}
              </p>

              {/* ✅ NEW: Depreciation Preview */}
              {summary && (
                <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-orange-500">
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Estimated Impact on Wholesale Value:
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const factors = [0.6, 0.8, 0.9, 0.95, 1.0];
                      const value = Math.round(summary.base * factors[rating - 1]);
                      const selected = rating === condition;
                      return (
                        <div key={rating} className={`p-2 rounded text-center ${selected ? 'bg-[#00d9a3] text-white font-bold' : 'bg-gray-100'}`}>
                          <div className="text-xs">{conditionLabels[rating]}</div>
                          <div className="font-bold">${value.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* OPTIONS */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">Additional Options</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {optionsList.map(o => (
                  <label key={o} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 transition">
                    <input type="checkbox" value={o} {...register('options')} className="w-5 h-5 accent-[#00d9a3] rounded cursor-pointer" />
                    <span className="text-sm text-gray-700">{o}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-[#00d9a3] to-[#00b87d] hover:from-[#00b87d] hover:to-[#009966] text-gray-900 font-bold text-lg rounded-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? '⚙️ Calculating Appraisal...' : '💰 Get Wholesale Value'}
            </button>
          </form>
        </div>
      </div>

      {/* ✅ NEW: RESULTS SECTION WITH DEPRECIATION */}
      {summary && quotes && depreciation && (
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

            {/* ✅ NEW: DEPRECIATION BREAKDOWN TABLE */}
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
                {!!lastId && API_BASE && (
                  <a href={`${API_BASE}/api/receipt/pdf/${lastId}`} target="_blank" rel="noreferrer" className="px-6 py-3 bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-semibold rounded-lg transition-all flex items-center gap-2">
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
      )}

      {/* FEATURES SECTION */}
      <div className="relative bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Quirk Trade Tool</h2>
          <div className="w-20 h-1 bg-[#00d9a3] mx-auto"></div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: '⚡', title: 'Instant Results', desc: 'Get valuations in seconds with automatic VIN decoding' },
            { icon: '🎯', title: 'Transparent Pricing', desc: 'Clear condition-based depreciation factors visible to your team' },
            { icon: '🔒', title: 'Multi-Source Accuracy', desc: 'Aggregated data from 6+ industry-leading valuation providers' }
          ].map((feat, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">{feat.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feat.title}</h3>
              <p className="text-gray-600">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="bg-gradient-to-br from-[#001a4d] to-[#003d99] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Trade-In Process?</h2>
          <p className="text-gray-200 mb-8 text-lg">Join Quirk dealership locations in getting accurate, transparent, condition-adjusted valuations in seconds.</p>
          <a href="mailto:mpalmer@quirkcars.com" className="inline-block px-8 py-4 bg-[#00d9a3] hover:bg-[#00b87d] text-[#001a4d] font-bold rounded-lg transition-all text-lg">
            Contact Us Today
          </a>
        </div>
      </div>
    </div>
  );
}
