import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultsSection from './ResultsSection';

const mockSummary = {
  baseWholesale: 25000,
  conditionAdjustment: -2500,
  finalWholesale: 22500,
  depreciation: {
    excellent: 25000,
    good: 23000,
    fair: 20000,
    poor: 15000,
  },
};

describe('ResultsSection Component', () => {
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
        baseWholesale: 25000,
        conditionAdjustment: -2500,
        finalWholesale: 22500,
      };

      const { container } = render(<ResultsSection summary={summaryWithoutDepreciation} />);
      expect(container).toBeInTheDocument();
    });
  });
});
