'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, TrendingUp, AlertCircle, ScanLine } from 'lucide-react';

// ---- Dealership list (Quirk multi-store) ----
type Dealership = { id: string; name: string; brand?: string };
const DEALERSHIPS: Dealership[] = [
  { id: 'quirk-chevy-braintree',  name: 'Quirk Chevrolet – Braintree, MA',  brand: 'Chevrolet' },
  { id: 'quirk-chevy-manchester', name: 'Quirk Chevrolet – Manchester, NH', brand: 'Chevrolet' },
  { id: 'quirk-ford-quincy',      name: 'Quirk Ford – Quincy, MA',          brand: 'Ford' },
  { id: 'quirk-cdjr-marshfield',  name: 'Quirk Chrysler Dodge Jeep Ram – Marshfield, MA', brand: 'CDJR' },
  { id: 'quirk-kia-braintree',    name: 'Quirk Kia – Braintree, MA',        brand: 'Kia' },
  { id: 'quirk-vw-braintree',     name: 'Quirk Volkswagen – Braintree, MA', brand: 'Volkswagen' },
  { id: 'quirk-subaru-quincy',    name: 'Quirk Subaru – Quincy, MA',        brand: 'Subaru' },
  { id: 'quirk-mazda-quincy',     name: 'Quirk Mazda – Quincy, MA',         brand: 'Mazda' }
];

// ---- Schema / types ----
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

type SourceQuote = { source: string; value: number };
type Summary = { low: number; high: number; avg: number; confidence: string };
type AppraiseResponse = { id: string; quotes: SourceQuote[]; summary: Summary; store?: Dealership; note?: string };

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
  Chevrolet: ['Blazer','Camaro','Colorado Crew Cab','Colorado Extended Cab','Corvette','Equinox','Malibu','Silverado 1500 Regular Cab','Silverado 1500 Extended Cab','Silverado 1500 Crew Cab','Silverado 2500 Regular Cab','Silverado 2500 Crew Cab','Silverado 3500 Regular Cab','Silverado 3500 Crew Cab','Suburban','Tahoe','Trailblazer','Traverse','Trax'],
  Chrysler: ['300','Pacifica'],
  Dodge: ['Challenger','Charger','Durango','Hornet'],
  Ford: ['Bronco','Bronco Sport','Edge','Escape','Expedition','Explorer','F-150 Regular Cab','F-150 SuperCab','F-150 SuperCrew','F-250 Regular Cab','F-250 SuperCab','F-250 Crew Cab','F-350 Regular Cab','F-350 SuperCab','F-350 Crew Cab','Maverick','Mustang','Ranger SuperCab','Ranger SuperCrew'],
  GMC: ['Acadia','Canyon Crew Cab','Canyon Extended Cab','Sierra 1500 Regular Cab','Sierra 1500 Double Cab','Sierra 1500 Crew Cab','Sierra 2500 Regular Cab','Sierra 2500 Crew Cab','Sierra 3500 Regular Cab','Sierra 3500 Crew Cab','Terrain','Yukon','Yukon XL'],
  Honda: ['Accord','Civic','CR-V','HR-V','Odyssey','Passport','Pilot','Ridgeline'],
  Hyundai: ['Elantra','Sonata','Tucson','Santa Fe','Palisade','Kona','Venue','Ioniq 5','Ioniq 6'],
  Jeep: ['Cherokee','Compass','Gladiator','Grand Cherokee','Grand Wagoneer','Renegade','Wagoneer','Wrangler 2-Door','Wrangler 4-Door','Wrangler Unlimited'],
  Kia: ['Forte','K5','Sportage','Sorento','Telluride','Seltos','Soul','EV6','Carnival'],
  Lexus: ['ES','IS','LS','GX','LX','NX','RX','UX','TX'],
  Mazda: ['Mazda3','Mazda6','CX-30','CX-5','CX-50','CX-9','CX-90','MX-5 Miata'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','S-Class','GLA','GLB','GLC','GLE','GLS','EQB','EQE','EQS'],
  Nissan: ['Altima','Maxima','Sentra','Versa','Ariya','Kicks','Rogue','Murano','Pathfinder','Armada','Frontier Crew Cab','Frontier King Cab','Titan Crew Cab','Titan King Cab','Z'],
  Ram: ['1500 Regular Cab','1500 Quad Cab','1500 Crew Cab','2500 Regular Cab','2500 Crew Cab','3500 Regular Cab','3500 Crew Cab','ProMaster'],
  Subaru: ['Impreza','Legacy','Outback','Crosstrek','Forester','Ascent','WRX','BRZ','Solterra'],
  Tesla: ['Model 3','Model S','Model X','Model Y'],
  Toyota: ['Camry','Corolla','Avalon','Prius','RAV4','Highlander','4Runner','Sequoia','Tacoma Access Cab','Tacoma Double Cab','Tundra Regular Cab','Tundra Double Cab','Tundra CrewMax','Sienna','bZ4X','GR86','Supra'],
  Volkswagen: ['Jetta','Passat','Arteon','Taos','Tiguan','Atlas','ID.4','Golf GTI'],
  Volvo: ['S60','S90','V60','V90','XC40','XC60','XC90','C40']
};

const optionsList = [
  'Navigation System','Sunroof/Moonroof','Leather Seats','Premium Sound System',
  'Third Row Seating','All-Wheel Drive','Adaptive Cruise Control','Heated Seats',
  'Backup Camera','Towing Package'
];

const conditionDescriptions: Record<number, string> = {
  1: 'Poor - Significant damage, needs major repairs',
  2: 'Fair - Visible wear, minor damage, functional',
  3: 'Good - Normal wear, clean, well-maintained',
  4: 'Very Good - Minimal wear, excellent condition',
  5: 'Excellent - Like new, pristine condition'
};

// NHTSA VIN Decoder (direct, no backend)
async function decodeVinWithNhtsa(vin: string): Promise<DecodedVin | null> {
  const cleaned = (vin || '').trim().toUpperCase();
  if (cleaned.length < 11) return null;

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(cleaned)}?format=json`
    );
    if (!response.ok) return null;
    
    const data = await response.json();
    const row = data?.Results?.[0];
    if (!row) return null;

    console.log('🔍 NHTSA Response:', row);

    return {
      year: Number(row.ModelYear) || undefined,
      make: row.Make || undefined,
      model: row.Model || undefined,
      trim: row.Trim || undefined,
    };
  } catch (e) {
    console.error('VIN decode failed:', e);
    return null;
  }
}

export default function Page() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(FormSchema), defaultValues: { storeId: DEALERSHIPS[0]?.id ?? '', condition: 3, options: [] } });

  const make = watch('make');
  const condition = watch('condition');
  const vin = watch('vin');

  const [decoding, setDecoding] = React.useState(false);
  const [quotes, setQuotes] = React.useState<SourceQuote[] | null>(null);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [lastId, setLastId] = React.useState<string | null>(null);

  const availableModels = make ? modelsByMake[make] || [] : [];

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const onSubmit = async (data: FormData) => {
    if (!API_BASE) {
      alert('API endpoint not configured.');
      return;
    }
    const res = await fetch(`${API_BASE}/api/appraise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      alert('Appraisal failed. Check logs.');
      return;
    }
    const payload: AppraiseResponse = await res.json();
    setQuotes(payload.quotes);
    setSummary(payload.summary);
    setLastId(payload.id);
  };

  const onDecodeVin = async () => {
    if (!vin || vin.length < 11) {
      alert('Enter at least 11 characters of a VIN.');
      return;
    }
    setDecoding(true);
    try {
      const decoded = await decodeVinWithNhtsa(vin);
      if (!decoded) {
        alert('VIN decode failed. Try again.');
        return;
      }
      if (decoded.year) setValue('year', decoded.year);
      if (decoded.make) setValue('make', decoded.make);
      if (decoded.model) setValue('model', decoded.model);
      if (decoded.trim) setValue('trim', decoded.trim);
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Multi-Source Vehicle Valuation (Demo)</h1>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Demo uses simulated valuations. Real integrations with licensed providers (Black Book, KBB, NADA, Manheim) are available.
              </p>
            </div>
          </div>

          {/* Dealership */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dealership *</label>
            <select {...register('storeId')} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Select a dealership</option>
              {DEALERSHIPS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.storeId && <p className="text-sm text-red-600 mt-1">{errors.storeId.message as string}</p>}
          </div>

          {/* VIN + Decode */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">VIN (optional)</label>
            <div className="flex gap-2">
              <input
                {...register('vin')}
                placeholder="e.g., 1G1ZT62812F113456"
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <button type="button"
                onClick={onDecodeVin}
                disabled={decoding || !vin}
                className={`px-4 py-2.5 rounded-lg font-semibold text-white ${decoding ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {decoding ? 'Decoding...' : (<span className="inline-flex items-center gap-2"><ScanLine className="w-4 h-4" /> Decode</span>)}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Decodes via NHTSA VPIC. In production, commercial decoders can be added.</p>
          </div>

          {/* Vehicle fields */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
              <select {...register('year')} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Year</option>
                {Array.from({ length: 30 }, (_, i) => currentYear - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Make *</label>
              <select {...register('make')} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Make</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.make && <p className="text-sm text-red-600 mt-1">{errors.make.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
              <select {...register('model')} disabled={!watch('make')}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100">
                <option value="">{watch('make') ? 'Select Model' : 'Select Make First'}</option>
                {(watch('make') ? (modelsByMake[watch('make')!] || []) : []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.model && <p className="text-sm text-red-600 mt-1">{errors.model.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Trim</label>
              <input {...register('trim')} placeholder="e.g., LE, Sport, Limited"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mileage *</label>
              <input type="number" {...register('mileage')} placeholder="Enter mileage"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              {errors.mileage && <p className="text-sm text-red-600 mt-1">{errors.mileage.message as string}</p>}
            </div>
          </div>

          {/* Condition */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Vehicle Condition: {condition}
            </label>
            <input type="range" min={1} max={5} {...register('condition')}
              className="w-full h-2 bg-gray-200 rounded-lg accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Poor</span><span>Fair</span><span>Good</span><span>Very Good</span><span>Excellent</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 italic">
              {conditionDescriptions[Number(condition) || 3]}
            </p>
          </div>

          {/* Options */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Options</label>
            <div className="grid grid-cols-2 gap-3">
              {optionsList.map(o => (
                <label key={o} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" value={o} {...register('options')}
                         className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">{o}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button disabled={isSubmitting}
            className={`w-full py-4 rounded-lg font-semibold text-white ${isSubmitting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {isSubmitting ? 'Calculating...' : 'Get Wholesale Value'}
          </button>

          {/* Results */}
          {summary && quotes && (
            <div className="mt-8 space-y-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Estimated Wholesale Value</h2>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold mb-2">${summary.low.toLocaleString()} - ${summary.high.toLocaleString()}</p>
                  <p className="text-indigo-100">Average: ${summary.avg.toLocaleString()} · Confidence: {summary.confidence}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Source Breakdown (Simulated)</h3>
                  {!!lastId && API_BASE && (
                    
                      className="text-sm font-semibold px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      href={`${API_BASE}/api/receipt/pdf/${lastId}`}
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
          )}
        </form>
      </div>
    </div>
  );
}
