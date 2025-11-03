import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuationForm } from '../ValuationForm';
import { useForm } from 'react-hook-form';

const renderForm = () => {
  const TestWrapper = () => {
    const methods = useForm({
      defaultValues: {
        storeId: 'quirk-chevy-manchester',
        condition: 3,
        year: '',
        make: '',
        model: '',
        mileage: '',
      },
    });

    return (
      <ValuationForm
        register={methods.register}
        errors={methods.formState.errors}
        isSubmitting={false}
        watch={methods.watch}
        setValue={methods.setValue}
        summary={null}
      />
    );
  };

  return render(<TestWrapper />);
};

describe('ValuationForm - Critical', () => {
  it('should render all required input fields', () => {
    renderForm();

    // Check for text content, not specific labels
    expect(screen.getByText(/year/i)).toBeInTheDocument();
    expect(screen.getByText(/make/i)).toBeInTheDocument();
    expect(screen.getByText(/model/i)).toBeInTheDocument();
    expect(screen.getByText(/mileage/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    renderForm();

    const button = screen.getByRole('button', { name: /get wholesale value/i });
    expect(button).toBeInTheDocument();
  });

  it('should show condition slider', () => {
    renderForm();

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('3');
  });

  describe('ResultsSection - Critical', () => {
    it('should handle missing depreciation gracefully', () => {
      const mockSummary = {
        base: 25000,
        low: 24000,
        high: 26000,
        avg: 25000,
        confidence: 'Medium' as const,
      };

      const TestWrapper = () => {
        const methods = useForm({
          defaultValues: {
            storeId: 'quirk-chevy-manchester',
            condition: 3,
          },
        });

        return (
          <ValuationForm
            register={methods.register}
            errors={methods.formState.errors}
            isSubmitting={false}
            watch={methods.watch}
            setValue={methods.setValue}
            summary={mockSummary}
          />
        );
      };

      const { container } = render(<TestWrapper />);
      
      // Should render without crashing
      expect(container).toBeInTheDocument();
    });

    it('should display base wholesale value', () => {
      const mockSummary = {
        base: 25000,
        low: 24000,
        high: 26000,
        avg: 25000,
        confidence: 'High' as const,
        depreciation: {
          depreciationFactor: 0.9,
          conditionRating: 3,
          finalWholesaleValue: 22500,
          conditionLabel: 'Good',
        },
      };

      const TestWrapper = () => {
        const methods = useForm({
          defaultValues: {
            storeId: 'quirk-chevy-manchester',
            condition: 3,
          },
        });

        return (
          <ValuationForm
            register={methods.register}
            errors={methods.formState.errors}
            isSubmitting={false}
            watch={methods.watch}
            setValue={methods.setValue}
            summary={mockSummary}
          />
        );
      };

      render(<TestWrapper />);
      
      // Look for the formatted value
      expect(screen.getByText(/25,000/)).toBeInTheDocument();
    });
  });
});
