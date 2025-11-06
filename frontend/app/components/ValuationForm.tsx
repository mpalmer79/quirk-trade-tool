'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { FormData, Summary } from '../lib/types';

interface ValuationFormProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  isSubmitting: boolean;
  watch: UseFormWatch<FormData>;
  setValue?: UseFormSetValue<FormData>;
  summary?: Summary | null;
}

export default function ValuationForm({
  register,
  errors,
  isSubmitting,
  watch,
  setValue,
  summary
}: ValuationFormProps) {
  const [vinError, setVinError] = React.useState<string>('');
  const [isDecoding, setIsDecoding] = React.useState(false);

  const handleVinDecode = async () => {
    const vin = watch('vin');
    if (!vin || vin.length !== 17) {
      setVinError('Please enter a 17-character VIN');
      return;
    }
    
    setIsDecoding(true);
    setVinError('');
    
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`);
      const data = await response.json();
      
      if (data.Results && data.Results[0] && setValue) {
        const result = data.Results[0];
        
        // Extract vehicle details from the response
        const yearStr = (result.ModelYear || '').toString().trim();
        const year = /^\d{4}$/.test(yearStr) ? parseInt(yearStr) : 0;
        const make = (result.Make || '').toString().trim();
        const model = (result.Model || '').toString().trim();
        const trim = (result.Trim || result.Series || '').toString().trim();
        
        // Update form fields
        if (year > 1980 && year <= new Date().getFullYear() + 1) {
          setValue('year', year);
        }
        if (make && make !== 'Not Applicable') {
          // Title case the make for display
          const titleCaseMake = make.split(' ').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          setValue('make', titleCaseMake);
        }
        if (model && model !== 'Not Applicable') {
          setValue('model', model);
        }
        if (trim && trim !== 'Not Applicable') {
          // Title case the trim for display
          const titleCaseTrim = trim.split(' ').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          setValue('trim', titleCaseTrim);
        }
        
        // Success feedback
        if (make && model) {
          setVinError(''); // Clear any error
        } else {
          setVinError('VIN decoded but some details could not be determined');
        }
      }
    } catch (error) {
      console.error('VIN decode failed:', error);
      setVinError('Failed to decode VIN. Please check your connection and try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dealership Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Dealership <span className="text-red-500">*</span>
        </label>
        <select 
          {...register('storeId', { required: 'Please select a dealership' })} 
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a dealership</option>
          <option value="1">Quirk Chevrolet - Manchester, NH</option>
          <option value="2">Quirk Buick GMC - Braintree, MA</option>
        </select>
        {errors.storeId && <p className="text-red-500 text-sm mt-1">{errors.storeId.message}</p>}
      </div>

      {/* VIN Input with Decode Button */}
      <div>
        <label className="block text-sm font-medium mb-2">
          VIN <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            {...register('vin', { 
              required: 'VIN is required',
              minLength: { value: 17, message: 'VIN must be 17 characters' },
              maxLength: { value: 17, message: 'VIN must be 17 characters' }
            })}
            placeholder="Enter 17-character VIN"
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={17}
            style={{ textTransform: 'uppercase' }}
            onBlur={(e) => e.target.value = e.target.value.toUpperCase()}
          />
          <button
            type="button"
            onClick={handleVinDecode}
            disabled={isDecoding || !watch('vin') || (watch('vin')?.length ?? 0) !== 17}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isDecoding ? 'Decoding...' : 'Decode VIN'}
          </button>
        </div>
        {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin.message}</p>}
        {vinError && <p className="text-amber-600 text-sm mt-1">{vinError}</p>}
      </div>

      {/* Vehicle Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            {...register('year', { 
              required: 'Year is required',
              valueAsNumber: true,
              min: { value: 1980, message: 'Year must be 1980 or later' },
              max: { value: new Date().getFullYear() + 1, message: 'Invalid year' }
            })}
            type="number"
            placeholder="2020"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            {...register('make', { required: 'Make is required' })}
            placeholder="Chevrolet"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            {...register('model', { required: 'Model is required' })}
            placeholder="Silverado"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Trim</label>
          <input
            {...register('trim')}
            placeholder="LT (optional)"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mileage */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Mileage <span className="text-red-500">*</span>
        </label>
        <input
          {...register('mileage', { 
            required: 'Mileage is required',
            valueAsNumber: true,
            min: { value: 0, message: 'Mileage must be positive' },
            max: { value: 999999, message: 'Mileage seems too high' }
          })}
          type="number"
          placeholder="50000"
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.mileage && <p className="text-red-500 text-sm mt-1">{errors.mileage.message}</p>}
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Condition <span className="text-red-500">*</span>
        </label>
        <select 
          {...register('condition', { 
            required: 'Condition is required',
            valueAsNumber: true 
          })} 
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select condition</option>
          <option value={5}>5 - Excellent (Like New)</option>
          <option value={4}>4 - Very Good (Minor Wear)</option>
          <option value={3}>3 - Good (Average)</option>
          <option value={2}>2 - Fair (Noticeable Issues)</option>
          <option value={1}>1 - Poor (Significant Problems)</option>
        </select>
        {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>}
      </div>

      {/* Options (Optional) */}
      <div>
        <label className="block text-sm font-medium mb-2">Additional Options</label>
        <div className="space-y-2">
          {['Leather Seats', 'Sunroof', 'Navigation', 'Premium Audio', 'Tow Package'].map(option => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                value={option}
                {...register('options')}
                className="mr-2"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Processing...' : 'Get Valuation'}
      </button>

      {/* Summary Display (if available) */}
      {summary && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Valuation Summary</h3>
          <p>Base Value: ${summary.base?.toLocaleString()}</p>
          <p>Average Value: ${summary.avg?.toLocaleString()}</p>
          <p>Range: ${summary.low?.toLocaleString()} - ${summary.high?.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
