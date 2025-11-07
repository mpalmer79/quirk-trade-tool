import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// 1) Mock react-hook-form so useForm is a vi.fn()
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual<typeof import('react-hook-form')>('react-hook-form');
  return {
    ...actual,
    useForm: vi.fn(() => ({
      register: vi.fn(() => ({})),
      watch: vi.fn(() => ''),
      setValue: vi.fn(),
      formState: { errors: {} }
    }))
  };
});

import ValuationForm from '../ValuationForm';

// Minimal props to render
const baseProps = {
  register: vi.fn() as any,
  errors: {},
  isSubmitting: false,
  watch: vi.fn() as any,
  setValue: vi.fn() as any,
  summary: null
};

describe('ValuationForm (critical)', () => {
  it('should render all required input fields', () => {
    render(<ValuationForm {...baseProps} />);
    expect(screen.getByLabelText(/dealership/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/make \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mileage \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condition \*/i)).toBeInTheDocument();
  });
});
