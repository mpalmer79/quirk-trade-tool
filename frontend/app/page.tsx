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
                <Info className=
