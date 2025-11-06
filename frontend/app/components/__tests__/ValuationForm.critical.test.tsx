import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import ValuationForm from '../ValuationForm';

// Mock the form hook
const MockedForm = () => {
  const { register, formState: { errors }, watch } = useForm();
  
  return (
    <ValuationForm 
      register={register}
      errors={errors}
      isSubmitting={false}
      watch={watch}
    />
  );
};

describe('ValuationForm', () => {
  it('should render all required input fields', () => {
    render(<MockedForm />);
    
    // Update these to match actual placeholders in your form
    expect(screen.getByPlaceholderText(/vin/i)).toBeInTheDocument();
  });
});
