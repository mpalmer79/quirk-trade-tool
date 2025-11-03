import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsSection } from '../ResultsSection';

describe('ResultsSection - Critical', () => {
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
    },
  };

  it('should display base wholesale value', () => {
    render(<ResultsSection summary={mockSummary} />);

    expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
  });

  it('should display final wholesale value', () => {
    render(<ResultsSection summary={mockSummary} />);

    expect(screen.getByText(/\$22,500/)).toBeInTheDocument();
  });

  it('should display confidence level', () => {
    render(<ResultsSection summary={mockSummary} />);

    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('should display value range', () => {
    render(<ResultsSection summary={mockSummary} />);

    expect(screen.getByText(/\$24,000/)).toBeInTheDocument(); // Low
    expect(screen.getByText(/\$26,000/)).toBeInTheDocument(); // High
  });

  it('should not render when summary is null', () => {
    const { container } = render(<ResultsSection summary={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
