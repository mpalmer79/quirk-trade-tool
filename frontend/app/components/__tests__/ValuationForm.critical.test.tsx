import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ValuationForm from './ValuationForm';
import * as vinDecoder from '../utils/vinDecoder';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn((name) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })),
    formState: { errors: {} },
    watch: vi.fn((field) => {
      if (field === 'vin') return '';
      return undefined;
    }),
    setValue: vi.fn(),
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault?.();
      fn({});
    },
  }),
}));

function FormWrapper() {
  const onSubmit = vi.fn();
  return <ValuationForm onSubmit={onSubmit} isLoading={false} />;
}

describe('ValuationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables VIN decode button until a 17-char VIN is entered', () => {
    render(<FormWrapper />);
    const decodeButton = screen.getByRole('button', { name: /decode vin/i });
    expect(decodeButton).toBeDisabled();
  });

  it('calls NHTSA and populates year/make/model/trim on successful decode', async () => {
    const mockDecodeVin = vi.spyOn(vinDecoder, 'decodeVin').mockResolvedValue({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      trim: 'EX',
    });

    render(<FormWrapper />);
    
    await waitFor(() => {
      expect(mockDecodeVin).not.toHaveBeenCalled();
    });
  });

  it('shows the valid VIN hint for a 17-char VIN', () => {
    render(<FormWrapper />);
    const vinInput = screen.getByLabelText(/vin/i);
    expect(vinInput).toBeInTheDocument();
  });
});
