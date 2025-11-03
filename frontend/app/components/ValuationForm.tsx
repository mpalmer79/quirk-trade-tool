import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Info, AlertCircle } from 'lucide-react';
import { DEALERSHIPS } from '../dealerships';
import type { FormData, Summary } from '../lib/types';

type ValuationFormProps = {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  isSubmitting: boolean;
  watch: UseFormWatch<FormData>;
  setValue: UseFormSetValue<FormData>;
  summary: Summary | null;
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
  Jeep: ['Cherokee','Compass','Grand Cherokee','Gladiator','Wrangler','Renegade','Wagoneer','Grand Wagoneer'],
  Kia: ['Forte','K5','Optima','Stinger','Soul','Seltos','Sportage','Sorento','Telluride','Carnival','EV6','Niro'],
  Lexus: ['ES','IS','LS','UX','NX','RX','GX','LX','LC'],
  Mazda: ['Mazda3','Mazda6','CX-3','CX-5','CX-9','CX-30','CX-50','CX-90','MX-5 Miata'],
  'Mercedes-Benz': ['A-Class','C-Class','E-Class','S-Class','GLA','GLB','GLC','GLE','GLS','EQS','EQE'],
  Nissan: ['Altima','Maxima','Sentra','Versa','Kicks','Rogue','Murano','Pathfinder','Armada','Frontier','Titan','Ariya','Leaf'],
  Ram: ['1500','2500','3500','ProMaster'],
  Subaru: ['Impreza','Legacy','Outback','Forester','Crosstrek','Ascent','BRZ','WRX','Solterra'],
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

async function decodeVinWithNhtsa(vin: string) {
  const cleaned = (vin || '').trim().toUpperCase();
  if (cleaned.length < 11) return null;

  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(cleaned)}?format=json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const row = data?.Results?.[0];
    if (!row) return null;

    let year = undefined;
    if (row.ModelYear) {
      const yearNum = parseInt(row.ModelYear.toString());
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
        year = yearNum;
      }
    }

    let make = row.Make || undefined;
    if (make && make !== '' && make !== 'Not Applicable') {
      make = make.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    } else {
      make = undefined;
    }

    let model = row.Model || undefined;
    if (model && model !== '' && model !== 'Not Applicable') {
      model = model.split('-').map((part: string) => 
        part.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      ).join('-');
    } else {
      model = undefined;
    }

    let trim = row.Trim || undefined;
    if (trim && trim !== '' && trim !== 'Not Applicable') {
      trim = trim.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    } else {
      trim = undefined;
    }

    return { year, make, model, trim };
  } catch (e) {
    console.error('VIN decode failed:', e);
    return null;
  }
}

export function ValuationForm({ register, errors, isSubmitting, watch, setValue, summary }: ValuationFormProps) {
  const currentYear = new Date().getFullYear();
  const make = watch('make');
  const condition = watch('condition');
  const vin = watch('vin');
  
  const [decoding, setDecoding] = React.useState(false);

  const handleDecodeVin = async () => {
    if (!vin) {
      alert('Please enter a VIN first');
      return;
    }

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

  return (
    <div className="space-y-8">
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
          <select {...register('model')} disabled={!make} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00d9a3] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500">
            <option value="">{make ? 'Select Model' : 'Select Make First'}</option>
            {(make ? (modelsByMake[make] || []) : []).map(m => <option key={m} value={m}>{m}</option>)}
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

        {/* Depreciation Preview */}
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
    </div>
  );
}
