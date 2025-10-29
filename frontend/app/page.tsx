'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, TrendingUp, AlertCircle, ScanLine, CheckCircle2, ArrowRight } from 'lucide-react';
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
  Chevrolet: ['Blazer','Camaro','Colorado','Corvette','Equinox','Malibu','Silverado','Suburban','Tahoe','Trailblazer','Traverse','Trax','Silverado 1500 Regular Cab','Silverado 1500 Extended Cab','Silverado 1500 Crew Cab','Silverado 2500 Regular Cab','Silverado 2500 Crew Cab','Silverado 3500 Regular Cab','Silverado 3500 Crew Cab','Colorado Crew Cab','Colorado Extended Cab'],
  Chrysler: ['300','Pacifica'],
  Dodge: ['Challenger','Charger','Durango','Hornet'],
  Ford: ['Bronco','Bronco Sport','Edge','Escape','Expedition','Explorer','F-150','F-250','F-350','Maverick','Mustang','Ranger','F-150 Regular Cab','F-150 SuperCab','F-150 SuperCrew','F-250 Regular Cab','F-250 SuperCab','F-250 Crew Cab','F-350 Regular Cab','F-350 SuperCab','F-350 Crew Cab','Ranger SuperCab','Ranger SuperCrew'],
  GMC: ['Acadia','Canyon','Sierra 1500','Sierra 2500','Sierra 3500','Terrain','Yukon','Yukon XL','Canyon Crew Cab','Canyon Extended Cab','Sierra 1500 Regular Cab','Sierra 1500 Double Cab','Sierra 1500 Crew Cab','Sierra 2500 Regular Cab','Sierra 2500 Crew Cab','Sierra 3500 Regular Cab','Sierra 3500 Crew Cab'],
  Honda: ['Accord','Civic','CR-V','HR-V','Odyssey','Passport','Pilot','Ridgeline'],
  Hyundai: ['Elantra','Sonata','Tucson','Santa Fe','Palisade','Kona','Venue','Ioniq 5','Ioniq 6'],
  Jeep: ['Cherokee','Compass','Gladiator','Grand Cherokee','Grand Wagoneer','Renegade','Wagoneer','Wrangler','Wrangler 2-Door','Wrangler 4-Door','Wrangler Unlimited'],
  Kia: ['Forte','K5','Sportage','Sorento','Telluride','Seltos','Soul','EV6','Carnival'],
  Lexus: ['ES','IS','LS','GX','LX','NX','RX','UX','TX'],
  Mazda: ['Mazda3','Mazda6','CX-30','CX-5','CX-50','CX-9','CX-90','MX-5 Miata'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','S-Class','GLA','GLB','GLC','GLE','GLS','EQB','EQE','EQS'],
  Nissan: ['Altima','Maxima','Sentra','Versa','Ariya','Kicks','Rogue','Murano','Pathfinder','Armada','Frontier','Titan','Z','Frontier Crew Cab','Frontier King Cab','Titan Crew Cab','Titan King Cab'],
  Ram: ['1500','2500','3500','ProMaster','1500 Regular Cab','1500 Quad Cab','1500 Crew Cab','2500 Regular Cab','2500 Crew Cab','3500 Regular Cab','3500 Crew Cab'],
  Subaru: ['Impreza','Legacy','Outback','Crosstrek','Forester','Ascent','WRX','BRZ','Solterra'],
  Tesla: ['Model 3','Model S','Model X','Model Y'],
  Toyota: ['Camry','Corolla','Avalon','Prius','RAV4','Highlander','4Runner','Sequoia','Tacoma','Tundra','Sienna','bZ4X','GR86','Supra','Tacoma Access Cab','Tacoma Double Cab','Tundra Regular Cab','Tundra Double Cab','Tundra CrewMax'],
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

async function decodeVinWithNhtsa(vin: string): Promise<DecodedVin | null> {
  const cleaned = (vin || '').trim().toUpperCase();
  if (cleaned.length < 11) return null;

  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(cleaned)}?format=json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const row = data?.Results?.[0];
    if (!row) return null;

    console.log('🔍 NHTSA Response:', row);

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
  const [lastId, setLastId] = React.useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  React.useEffect(() => {
    if (vin && vin.length === 17 && !decoding) {
      console.log('📍 Auto-decoding VIN:', vin);
      (async () => {
        setDecoding(true);
        try {
          const decoded = await decodeVinWithNhtsa(vin);
          if (decoded) {
            if (decoded.year) setValue('year', decoded.year);
            if (decoded.make) {
              setValue('make', decoded.make);
              setPendingData(decoded);
            }
          }
        } finally {
          setDecoding(false);
        }
      })();
    }
  }, [vin, decoding, setValue]);

  React.useEffect(() => {
    if (pendingData && make === pendingData.make) {
      console.log('✅ Applying pending model/trim:', pendingData);
      if (pendingData.model) setValue('model', pendingData.model);
      if (pendingData.trim) setValue('trim', pendingData.trim);
      setPendingData(null);
    }
  }, [make, pendingData, setValue]);

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
      if (decoded.make) {
        setValue('make', decoded.make);
        setPendingData(decoded);
      }
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="w-full overflow-hidden bg-gray-50">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-[#001a4d] to-[#003d99] text-white pt-20 pb-32 relative">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Get Accurate Trade Values<br />
            <span className="text-[#00d9a3]">Instantly</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Real-time integration with Black Book, Quincy Auto Auction, Auction Edge, Manheim, KBB, and NADA for accurate appraisal values powered by Quirk AI.
          </p>
        </div>
      </div>

      {/* WAVE DIVIDER */}
      <div className="relative -mt-12 bg-white">
        <div className="absolute inset-0 bg-white" style={{ clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)' }}></div>
        <div className="h-20"></div>
      </div>

      {/* FORM SECTION */}
      <div className="relative bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xl p-10">
            {/* DEALERSHIP */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Select Your Dealership *</label>
              <select {...register('storeId')} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800">
                <option value="">Choose a dealership...</option>
                {DEALERSHIPS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.storeId && <p className="text-red-600 text-sm mt-2">{errors.storeId.message as string}</p>}
            </div>

            {/* VIN INPUT */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Vehicle VIN (optional)</label>
              <div className="flex gap-3">
                <input 
                  {...register('vin')} 
                  placeholder="Enter VIN (e.g., 1G1ZT62812F113456)" 
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] uppercase bg-white text-gray-800"
                />
                <button 
                  type="button" 
                  onClick={onDecodeVin} 
                  disabled={decoding || !vin}
                  className="px-6 py-3 bg-[#00d9a3] hover:bg-[#00b87d] text-white font-semibold rounded-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ScanLine className="w-4 h-4" />
                  {decoding ? 'Decoding...' : 'Decode'}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Auto-decodes when 17 characters are entered</p>
            </div>

            {/* VEHICLE DETAILS GRID */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Year *</label>
                <select {...register('year')} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800">
                  <option value="">Select Year</option>
                  {Array.from({ length: 30 }, (_, i) => currentYear - i).map(y => <option key={y} value={y}>{y}</option>)}
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

            {/* CONDITION SLIDER */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Vehicle Condition: <span className="text-[#00d9a3]">{condition}</span></label>
              <input type="range" min={1} max={5} {...register('condition')} className="w-full h-2 bg-gray-300 rounded-lg accent-[#00d9a3]" />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Poor</span><span>Fair</span><span>Good</span><span>Very Good</span><span>Excellent</span>
              </div>
              <p className="text-sm text-gray-600 mt-3 italic">{conditionDescriptions[Number(condition) || 3]}</p>
            </div>

            {/* OPTIONS */}
            <div className="mb-10">
              <label className="block text-sm font-semibold text-gray-800 mb-4">Additional Options</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {optionsList.map(o => (
                  <label key={o} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" value={o} {...register('options')} className="w-5 h-5 accent-[#00d9a3] rounded" />
                    <span className="text-sm text-gray-700">{o}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-[#00d9a3] to-[#00b87d] hover:from-[#00b87d] hover:to-[#009966] text-white font-bold rounded-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? 'Calculating Appraisal...' : 'Get Wholesale Value'}
            </button>
          </form>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {summary && quotes && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* APPRAISAL CARD */}
            <div className="bg-gradient-to-br from-[#001a4d] to-[#003d99] rounded-2xl shadow-2xl p-10 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#00d9a3] bg-opacity-20 p-3 rounded-lg">
                  <DollarSign className="w-8 h-8 text-[#00d9a3]" />
                </div>
                <h2 className="text-3xl font-bold">Estimated Wholesale Value</h2>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold mb-3">${summary.low.toLocaleString()} - ${summary.high.toLocaleString()}</p>
                <p className="text-gray-200 text-lg">Average: <span className="text-[#00d9a3] font-semibold">${summary.avg.toLocaleString()}</span> · Confidence: <span className="text-[#00d9a3] font-semibold">{summary.confidence}</span></p>
              </div>
            </div>

            {/* SOURCES BREAKDOWN */}
            <div className="bg-white rounded-2xl shadow-lg p-10">
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
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-[#00d9a3]">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
                      <span className="font-semibold text-gray-700">{q.source}</span>
                    </div>
                    <span className="text-xl font-bold text-[#00d9a3]">${q.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="bg-[#fff8e6] border-l-4 border-[#ff9800] rounded-lg p-6">
              <p className="text-gray-800"><strong>✓ Powered by Quirk AI</strong> – Real-time integration with Black Book, Quincy Auto Auction, Auction Edge, Manheim, KBB, and NADA. Demo tool using simulated valuations. Real provider quotes require licensed integrations.</p>
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
            { icon: '⚡', title: 'Instant Results', desc: 'Get valuations in seconds with auto-decode on VIN entry' },
            { icon: '🎯', title: 'Accurate Data', desc: 'Powered by real-time feeds from industry-leading providers' },
            { icon: '🔒', title: 'Trusted Platform', desc: 'Seamless integration across all Quirk dealership locations' }
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
      <div className="bg-gradient-to-br from-[#001a4d] to-[#003d99] text-white py-16 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Streamline Your Appraisals?</h2>
          <p className="text-gray-200 mb-8 text-lg">Join Quirk dealerships in getting accurate, real-time trade valuations</p>
          <a href="mailto:hello@quirkcars.com" className="inline-block px-8 py-4 bg-[#00d9a3] hover:bg-[#00b87d] text-[#001a4d] font-bold rounded-lg transition-all text-lg">
            Contact Us Today
          </a>
        </div>
      </div>
    </div>
  );
}
