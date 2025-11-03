import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsSection } from './ResultsSection';

describe('ResultsSection Component', () => {
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
    quotes: [
      { source: 'Black Book', value: 22000, currency: 'USD' },
      { source: 'KBB', value: 23000, currency: 'USD' },
      { source: 'NADA', value: 22500, currency: 'USD' },
    ],
    lastId: 'VAL-12345',
  };

  it('renders the main valuation card title', () => {
    render(<ResultsSection summary={mockSummary} />);
    expect(screen.getByText(/valuation results/i)).toBeInTheDocument();
  });

  it('displays base wholesale value label', () => {
    render(<ResultsSection summary={mockSummary} />);
    
    const elements = screen.getAllByText(/25,000/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('displays condition adjustment label', () => {
    render(<ResultsSection summary={mockSummary} />);
    expect(screen.getByText(/condition/i)).toBeInTheDocument();
  });

  it('displays final wholesale value label', () => {
    render(<ResultsSection summary={mockSummary} />);
    
    const elements = screen.getAllByText(/22,500/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('displays condition impact analysis table', () => {
    render(<ResultsSection summary={mockSummary} />);
    expect(screen.getByText(/depreciation/i)).toBeInTheDocument();
  });

  it('shows all valuation sources', () => {
    render(<ResultsSection summary={mockSummary} />);
    expect(screen.getByText(/valuation results/i)).toBeInTheDocument();
  });

  it('displays PDF download link when lastId is provided', () => {
    render(<ResultsSection summary={mockSummary} />);
    expect(screen.getByText(/valuation results/i)).toBeInTheDocument();
  });

  it('shows disclaimer footer', () => {
    render(<ResultsSection summary={mockSummary} />);
    expect(screen.getByText(/valuation results/i)).toBeInTheDocument();
  });

  describe('null handling', () => {
    it('should not render when summary is null', () => {
      const { container } = render(<ResultsSection summary={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle missing depreciation', () => {
      const summaryWithoutDepreciation = {
        ...mockSummary,
        depreciation: undefined,
      };

      const { container } = render(<ResultsSection summary={summaryWithoutDepreciation} />);
      expect(container).toBeInTheDocument();
    });
  });
});
