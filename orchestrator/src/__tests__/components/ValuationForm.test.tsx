import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('ValuationForm', () => {
  it('submits form and displays results', async () => {
    // MOCK: Intercept fetch calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'val-123',
          baseWholesaleValue: 18000,
          finalWholesaleValue: 16200
        })
      })
    );

    // RENDER: Draw the component
    render(<ValuationForm />);

    // ACT: Simulate user actions
    fireEvent.change(screen.getByLabelText(/year/i), { 
      target: { value: '2020' } 
    });
    fireEvent.change(screen.getByLabelText(/make/i), { 
      target: { value: 'Honda' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));

    // ASSERT: Check results appeared
    await waitFor(() => {
      expect(screen.getByText(/\$16,200/i)).toBeInTheDocument();
    });
  });
});
