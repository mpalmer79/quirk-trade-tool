import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuationForm } from './ValuationForm';
import { useForm } from 'react-hook-form';

// Mock the DEALERSHIPS import
vi.mock('../dealerships', () => ({
  DEALERSHIPS: [
    { id: '1', name: 'Test Dealership', city: 'Boston', state: 'MA' }
  ]
}));

describe('ValuationForm Component', () => {
  const renderForm = (summary = null) => {
    const TestWrapper = () => {
      const { register, formState: { errors }, watch, setValue } = useForm({
        defaultValues: { 
          storeId: '1', 
          condition: 3, 
          options: [] 
        }
      });
      
      return (
        <ValuationForm
          register={register}
          errors={errors}
          isSubmitting={false}
          watch={watch}
          setValue={setValue}
          summary={summary}
        />
      );
    };
    
    return render(<TestWrapper />);
  };

  it('renders dealership selection dropdown', () => {
    renderForm();
    expect(screen.getByText('Dealership Location *')).toBeInTheDocument();
    expect(screen.getByText(/Test Dealership/i)).toBeInTheDocument();
  });

  it('renders VIN input and decode button', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/1G1ZT62812F113456/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument();
  });

  it('renders all required vehicle fields', () => {
    renderForm();
    expect(screen.getByText('Year *')).toBeInTheDocument();
    expect(screen.getByText('Make *')).toBeInTheDocument();
    expect(screen.getByText('Model *')).toBeInTheDocument();
    expect(screen.getByText('Mileage *')).toBeInTheDocument();
  });

  it('renders condition slider with labels', () => {
    renderForm();
    expect(screen.getByText(/Vehicle Condition:/i)).toBeInTheDocument();
    expect(screen.getByText('Poor (1)')).toBeInTheDocument();
    expect(screen.getByText('Excellent (5)')).toBeInTheDocument();
  });

  it('renders additional options checkboxes', () => {
    renderForm();
    expect(screen.getByText('Additional Options')).toBeInTheDocument();
    expect(screen.getByLabelText(/Navigation System/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Leather Seats/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderForm();
    const submitButton = screen.getByRole('button', { name: /Get Wholesale Value/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('disables decode button when VIN is less than 17 characters', () => {
    renderForm();
    const decodeButton = screen.getByRole('button', { name: /decode/i });
    expect(decodeButton).toBeDisabled();
  });

  it('shows depreciation preview when summary exists', () => {
    const mockSummary = {
      base: 25000,
      low: 24000,
      high: 26000,
      avg: 25000,
      confidence: 'High',
      depreciation: null as any
    };
    
    renderForm(mockSummary);
    expect(screen.getByText('Estimated Impact on Wholesale Value:')).toBeInTheDocument();
  });
});
