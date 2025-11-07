import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useForm } from 'react-hook-form';
import ValuationForm from '../ValuationForm';

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
  UseFormRegister: vi.fn(),
  FieldErrors: vi.fn(),
  UseFormWatch: vi.fn(),
  UseFormSetValue: vi.fn(),
}));

describe('ValuationForm', () => {
  beforeEach(() => {
    (useForm as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      register: vi.fn(() => ({})),
      formState: { errors: {} },
      watch: vi.fn(() => ''),
      setValue: vi.fn(),
    });
  });

  it('should render all required input fields', () => {
    const mockProps = {
      register: vi.fn(() => ({})),
      errors: {},
      isSubmitting: false,
      watch: vi.fn(() => ''),
      setValue: vi.fn(),
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
