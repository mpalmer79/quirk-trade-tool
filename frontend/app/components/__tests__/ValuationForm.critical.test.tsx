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

    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mileage/i)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    renderForm();

    const button = screen.getByRole('button', { name: /get wholesale value/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should accept numeric input for year', async () => {
    const user = userEvent.setup();
    renderForm();

    const yearInput = screen.getByLabelText(/year/i);
    await user.type(yearInput, '2020');

    expect(yearInput).toHaveValue('2020');
  });

  it('should accept numeric input for mileage', async () => {
    const user = userEvent.setup();
    renderForm();

    const mileageInput = screen.getByLabelText(/mileage/i);
    await user.type(mileageInput, '45000');

    expect(mileageInput).toHaveValue('45000');
  });

  it('should show condition slider with correct default', () => {
    renderForm();

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('3');
  });
});
