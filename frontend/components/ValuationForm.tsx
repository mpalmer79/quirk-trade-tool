'use client';

import React from 'react';
import { useForm } from 'react-hook-form';

type FormData = {
  storeId: string;
  vin: string;
  year: number | string;
  make: string;
  model: string;
  trim?: string;
  mileage: number | string;
  condition: number | string;
  options?: string[];
};

type Summary = {
  base?: number;
  avg?: number;
};

export default function ValuationForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      storeId: '',
      vin: '',
      year: '',
      make: '',
      model: '',
      trim: '',
      mileage: '',
      condition: '',
      options: [],
    },
  });

  const [vinError, setVinError] = React.useState<string>('');
  const [isDecoding, setIsDecoding] = React.useState(false);

  const [jdRetail, setJdRetail] = React.useState<number | null>(null);
  const [isJdLoading, setIsJdLoading] = React.useState(false);

  const [summary, setSummary] = React.useState<Summary | null>(null);

  const yearValue = watch('year');
  const makeValue = watch('make');
  const modelValue = watch('model');
  const mileageValue = watch('mileage');

  // --- Helpers for JD Power via Netlify Functions ---

  async function jdLookupUcgVehicleId(params: {
    modelyear: number;
    make: string;
    model: string;
    period?: string | number; // "0" = current month
  }): Promise<string> {
    const qs = new URLSearchParams(
      Object.entries({
        mode: 'lookup',
        period: params.period ?? '0',
        modelyear: params.modelyear,
        make: params.make,
        model: params.model,
      }).map(([k, v]) => [k, String(v)])
    );
    const res = await fetch(`/api/jdpower?${qs.toString()}`);
    if (!res.ok) throw new Error(`JDPOWER_LOOKUP_${res.status}`);
    const data = await res.json();
    const id = data?.result?.[0]?.ucgvehicleid;
    if (!id) throw new Error('JDPOWER_NO_UCG_ID');
    return String(id);
  }

  async function jdFetchValues(params: {
    ucgvehicleid: string | number;
    mileage: number;
    region: number;
    period?: string | number;
  }) {
    const qs = new URLSearchParams(
      Object.entries({
        mode: 'value',
        period: params.period ?? '0',
        ucgvehicleid: params.ucgvehicleid,
        mileage: params.mileage,
        region: params.region,
      }).map(([k, v]) => [k, String(v)])
    );
    const res = await fetch(`/api/jdpower?${qs.toString()}`);
    if (!res.ok) throw new Error(`JDPOWER_VALUE_${res.status}`);
    const data = await res.json();
    const row = data?.result?.[0];
    if (!row) throw new Error('JDPOWER_EMPTY_VALUES');
    return row as {
      baseroughtrade?: number;
      baseaveragetrade?: number;
      basecleantrade?: number;
      basecleanretail?: number;
      [k: string]: unknown;
    };
  }

  // --- VIN decode via Netlify vPIC proxy (optional but recommended for consistent CORS) ---
  const handleVinDecode = async () => {
    const vin = String(watch('vin') || '').trim().toUpperCase();
    if (!vin || vin.length !== 17) {
      setVinError('Please enter a 17-character VIN');
      return;
    }
    setVinError('');
    setIsDecoding(true);
    try {
      // If you created netlify/functions/vpic.ts this goes same-origin
      const res = await fetch(`/api/vpic?vin=${encodeURIComponent(vin)}`);
      if (!res.ok) throw new Error(`VPIC_${res.status}`);
      const data = await res.json();

      const getByVarId = (id: number) => {
        const hit = data?.Results?.find((r: any) => r?.VariableId === id);
        return hit?.Value && hit.Value !== 'Not Applicable' ? hit.Value : '';
      };

      const year = parseInt(getByVarId(29) || '0', 10);
      const make = getByVarId(26);
      const model = getByVarId(28);
      const trim = getByVarId(109);

      if (Number.isFinite(year) && year > 1980 && year <= new Date().getFullYear() + 1) {
        setValue('year', year);
      }
      if (make) setValue('make', make);
      if (model) setValue('model', model);
      if (trim) setValue('trim', trim);

      if (!make || !model) {
        setVinError('VIN decoded but some details could not be determined');
      }
    } catch (err) {
      console.error('VIN decode failed:', err);
      setVinError('Failed to decode VIN. Please try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  // --- Form submit (stub) ---
  const onSubmit = async (values: FormData) => {
    setSummary(null);
    // Replace this with your orchestrator call when you’re ready:
    // const resp = await fetch('/api/valuations', { method: 'POST', body: JSON.stringify(values) })
    // const result = await resp.json();

    // Temporary local summary to confirm the flow works:
    const base = jdRetail ?? 0;
    setSummary({
      base,
      avg: base ? Math.round(base * 0.97) : undefined, // sample adjustment
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* Dealership */}
      <div>
        <label htmlFor="storeId" className="block text-sm font-medium mb-2">
          Dealership <span className="text-red-500">*</span>
        </label>
        <select
          id="storeId"
          {...register('storeId', { required: 'Please select a dealership' })}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          defaultValue=""
        >
          <option value="" disabled>
            Select a dealership
          </option>
          <option value="1">Quirk Chevrolet - Manchester, NH</option>
          <option value="2">Quirk Buick GMC - Braintree, MA</option>
        </select>
        {errors.storeId && <p className="text-red-500 text-sm mt-1">{errors.storeId.message as string}</p>}
      </div>

      {/* VIN + Decode */}
      <div>
        <label htmlFor="vin" className="block text-sm font-medium mb-2">
          VIN <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="vin"
            {...register('vin', {
              required: 'VIN is required',
              minLength: { value: 17, message: 'VIN must be 17 characters' },
              maxLength: { value: 17, message: 'VIN must be 17 characters' },
            })}
            placeholder="Enter 17-character VIN"
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={17}
            onBlur={(e) => {
              e.target.value = e.target.value.toUpperCase();
              setValue('vin', e.target.value);
            }}
          />
          <button
            type="button"
            onClick={handleVinDecode}
            disabled={isDecoding || String(watch('vin') || '').length !== 17}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isDecoding ? 'Decoding…' : 'Decode VIN'}
          </button>
        </div>
        {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin.message as string}</p>}
        {vinError && <p className="text-amber-600 text-sm mt-1">{vinError}</p>}
      </div>

      {/* Vehicle Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            id="year"
            type="number"
            {...register('year', {
              required: 'Year is required',
              valueAsNumber: true,
              min: { value: 1980, message: 'Year must be 1980 or later' },
              max: { value: new Date().getFullYear() + 1, message: 'Invalid year' },
            })}
            placeholder="2020"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message as string}</p>}
        </div>

        <div>
          <label htmlFor="make" className="block text-sm font-medium mb-2">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            id="make"
            {...register('make', { required: 'Make is required' })}
            placeholder="Chevrolet"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make.message as string}</p>}
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium mb-2">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            id="model"
            {...register('model', { required: 'Model is required' })}
            placeholder="Silverado"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message as string}</p>}
        </div>

        <div>
          <label htmlFor="trim" className="block text-sm font-medium mb-2">
            Trim
          </label>
          <input
            id="trim"
            {...register('trim')}
            placeholder="LT (optional)"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mileage */}
      <div>
        <label htmlFor="mileage" className="block text-sm font-medium mb-2">
          Mileage <span className="text-red-500">*</span>
        </label>
        <input
          id="mileage"
          type="number"
          {...register('mileage', {
            required: 'Mileage is required',
            valueAsNumber: true,
            min: { value: 0, message: 'Mileage must be positive' },
            max: { value: 999999, message: 'Mileage seems too high' },
          })}
          placeholder="50000"
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.mileage && <p className="text-red-500 text-sm mt-1">{errors.mileage.message as string}</p>}
      </div>

      {/* Condition */}
      <div>
        <label htmlFor="condition" className="block text-sm font-medium mb-2">
          Condition <span className="text-red-500">*</span>
        </label>
        <select
          id="condition"
          {...register('condition', { required: 'Condition is required', valueAsNumber: true })}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          defaultValue=""
        >
          <option value="" disabled>
            Select condition
          </option>
          <option value={5}>5 - Excellent (Like New)</option>
          <option value={4}>4 - Very Good (Minor Wear)</option>
          <option value={3}>3 - Good (Average)</option>
          <option value={2}>2 - Fair (Noticeable Issues)</option>
          <option value={1}>1 - Poor (Significant Problems)</option>
        </select>
        {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message as string}</p>}
      </div>

      {/* J.D. Power Preview (non-blocking) */}
      <div className="border rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">J.D. Power Retail (Preview)</p>
            <p className="text-xs text-gray-500">Uses current period with your Year/Make/Model + Mileage.</p>
          </div>
          <button
            type="button"
            disabled={
              isJdLoading ||
              !yearValue ||
              !makeValue ||
              !modelValue ||
              !mileageValue
            }
            onClick={async () => {
              try {
                setIsJdLoading(true);
                setJdRetail(null);

                const ucgvehicleid = await jdLookupUcgVehicleId({
                  modelyear: Number(yearValue),
                  make: String(makeValue),
                  model: String(modelValue),
                });

                const values = await jdFetchValues({
                  ucgvehicleid,
                  mileage: Number(mileageValue),
                  region: 1, // swap for your store/zip resolver later
                });

                const retail = Number(values?.basecleanretail ?? 0);
                setJdRetail(Number.isFinite(retail) && retail > 0 ? retail : null);
              } catch (e) {
                console.error('JD Power fetch failed:', e);
                setJdRetail(null);
              } finally {
                setIsJdLoading(false);
              }
            }}
            className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm disabled:opacity-50"
          >
            {isJdLoading ? 'Fetching…' : 'Get JD Power Value'}
          </button>
        </div>
        <div className="mt-2 text-sm">
          {jdRetail != null ? (
            <span>Base Clean Retail: ${jdRetail.toLocaleString()}</span>
          ) : (
            <span className="text-gray-500">No value yet.</span>
          )}
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium mb-2">Additional Options</label>
        <div className="space-y-2">
          {['Leather Seats', 'Sunroof', 'Navigation', 'Premium Audio', 'Tow Package'].map((option) => (
            <label key={option} className="flex items-center">
              <input type="checkbox" value={option} {...register('options')} className="mr-2" />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Processing…' : 'Get Valuation'}
      </button>

      {/* Summary */}
      {summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Valuation Summary</h3>
          <p>Base Value: ${summary.base?.toLocaleString() ?? 0}</p>
          <p>Adjusted Value: ${summary.avg?.toLocaleString() ?? 0}</p>
        </div>
      )}
    </form>
  );
}
