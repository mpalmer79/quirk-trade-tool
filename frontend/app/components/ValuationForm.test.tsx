/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import ValuationForm from './ValuationForm';

type FormData = {
  storeId: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage: number;
  condition: number;
  options: string[];
};

function FormWrapper() {
  const { register, formState: { errors }, watch, setValue, handleSubmit } = useForm<FormData>({
    defaultValues: {
      storeId: '1',
      vin: '',
      year: undefined,
      make: '',
      model: '',
      trim: '',
      mileage: 0,
      condition: 3,
      options: []
    }
  });

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <ValuationForm
        register={register}
        errors={errors}
        isSubmitting={false}
        watch={watch}
        setValue={setValue}
        summary={null}
      />
    </form>
  );
}

const VIN_PLACEHOLDER = /17[-\s]*character\s*vin/i; // matches: "Enter 17-character VIN"

describe('ValuationForm', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        Results: [
          { VariableId: 29, Value: '2022' },  // Model Year
          { VariableId: 26, Value: 'NISSAN' }, // Make
          { VariableId: 28, Value: 'Frontier' }, // Model
          { VariableId: 109, Value: 'PRO-4X' } // Trim
        ]
      })
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disables VIN decode button until a 17-char VIN is entered', () => {
    render(<FormWrapper />);

    const vinInput = screen.getByPlaceholderText(VIN_PLACEHOLDER);
    const decodeBtn = screen.getByRole('button', { name: /decode/i });

    // Initially disabled
    expect(decodeBtn).toBeDisabled();

    // Enter short VIN -> still disabled
    fireEvent.change(vinInput, { target: { value: '1N6ED1CMXSN6237' } });
    expect(decodeBtn).toBeDisabled();

    // Enter full VIN (17 chars) -> enabled
    fireEvent.change(vinInput, { target: { value: '1N6ED1CMXSN623773' } });
    expect(decodeBtn).toBeEnabled();
  });

  it('calls NHTSA and populates year/make/model/trim on successful decode', async () => {
    render(<FormWrapper />);

    const vinInput = screen.getByPlaceholderText(VIN_PLACEHOLDER);
    const decodeBtn = screen.getByRole('button', { name: /decode/i });

    fireEvent.change(vinInput, { target: { value: '1N6ED1CMXSN623773' } });
    fireEvent.click(decodeBtn);

    await waitFor(() => {
      // Year input should reflect decoded year
      const yearInput = screen.getByLabelText(/year \*/i) as HTMLInputElement;
      expect(yearInput.value).toBe('2022');

      // Make input should reflect decoded make
      const makeInput = screen.getByLabelText(/make \*/i) as HTMLInputElement;
      expect(makeInput.value).toBe('NISSAN');

      // Model input should reflect decoded model
      const modelInput = screen.getByLabelText(/model \*/i) as HTMLInputElement;
      expect(modelInput.value).toBe('Frontier');

      // Trim input populated
      const trimInput = screen.getByLabelText(/trim/i) as HTMLInputElement;
      expect(trimInput.value).toBe('PRO-4X');
    });

    // Ensure fetch was called with the NHTSA endpoint
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/vpic\.nhtsa\.dot\.gov\/api\/vehicles\/DecodeVin\/1N6ED1CMXSN623773/i);
  });

  it('shows the valid VIN hint for a 17-char VIN', () => {
    render(<FormWrapper />);

    const vinInput = screen.getByPlaceholderText(VIN_PLACEHOLDER);
    fireEvent.change(vinInput, { target: { value: '1N6ED1CMXSN623773' } });

    expect(screen.getByText(/✓\s*valid\s*vin\s*format/i)).toBeInTheDocument();
  });
});
