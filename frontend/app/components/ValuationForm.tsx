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
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
      const data = await response.json();
      
      if (data.Results && setValue) {
        // Map NHTSA variable IDs to values
        const getValueByVariableId = (id: number) => {
          const result = data.Results.find((r: any) => r.VariableId === id);
          return result?.Value || '';
        };
        
        // Extract vehicle details
        const year = parseInt(getValueByVariableId(29)) || 0;
        const make = getValueByVariableId(26);
        const model = getValueByVariableId(28);
        const trim = getValueByVariableId(109); // Trim variable ID
        
        // Update form fields
        if (year > 1980 && year <= new Date().getFullYear() + 1) {
          setValue('year', year);
        }
        if (make && make !== 'Not Applicable') {
          setValue('make', make);
        }
        if (model && model !== 'Not Applicable') {
          setValue('model', model);
        }
        if (trim && trim !== 'Not Applicable') {
          setValue('trim', trim);
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
            onClick={handleVinDecode || (() => {})}
            disabled={isDecoding || !watch('vin') || watch('vin').length !== 17}
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
