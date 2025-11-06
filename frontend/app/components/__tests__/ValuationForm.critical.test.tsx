import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import ValuationForm from '../ValuationForm';

jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
  UseFormRegister: jest.fn(),
  FieldErrors: jest.fn(),
  UseFormWatch: jest.fn(),
  UseFormSetValue: jest.fn(),
}));

describe('ValuationForm', () => {
  beforeEach(() => {
    (useForm as jest.Mock).mockReturnValue({
      register: jest.fn(() => ({})),
      formState: { errors: {} },
      watch: jest.fn(() => ''),
      setValue: jest.fn(),
    });
  });

  it('should render all required input fields', () => {
    const mockProps = {
      register: jest.fn(() => ({})),
      errors: {},
      isSubmitting: false,
      watch: jest.fn(() => ''),
      setValue: jest.fn(),
      summary: null,
    };

    render(<ValuationForm {...mockProps} />);
    
    // Check for the VIN input
    expect(screen.getByPlaceholderText(/Enter 17-character VIN/i)).toBeInTheDocument();
    
    // Check for other inputs
    expect(screen.getByPlaceholderText(/2020/)).toBeInTheDocument(); // Year
    expect(screen.getByPlaceholderText(/Chevrolet/)).toBeInTheDocument(); // Make
    expect(screen.getByPlaceholderText(/Silverado/)).toBeInTheDocument(); // Model
    expect(screen.getByPlaceholderText(/50000/)).toBeInTheDocument(); // Mileage
  });
});
