import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsSection } from './ResultsSection';

vi.mock('../lib/api', () => ({
  getPdfReceiptUrl: (id: string) => `http://localhost:4000/api/receipt/pdf/${id}`
}));

describe('ResultsSection Component', () => {
  const mockQuotes = [
    { source: 'Black Book', value: 25000 },
    { source: 'KBB', value: 26000 },
    { source: 'NADA', value: 24500 }
  ];

  const mockDepreciation = {
    baseWholesaleValue: 25000,
    conditionRating: 3,
    conditionLabel: 'Good',
    depreciationFactor: 0.9,
    depreciationPercentage: 10,
    depreciationAmount: 2500,
    finalWholesaleValue: 22500,
    breakdown: {
      excellent: 25000,
      veryGood: 23750,
      good: 22500,
      fair: 20000,
      poor: 15000
    }
  };

  const mockSummary = {
    base: 25000,
    low: 24500,
    high: 26000,
    avg: 25167,
    confidence: 'High',
    depreciation: mockDepreciation
  };

  it('renders the main valuation card title', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText('Estimated Trade-In Value')).toBeInTheDocument();
  });

  it('displays base wholesale value', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText('Base Wholesale Value')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });

  it('displays depreciation adjustment', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText(/Condition Adjustment/i)).toBeInTheDocument();
    expect(screen.getByText('−$2,500')).toBeInTheDocument();
  });

  it('displays final wholesale value', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText('Final Wholesale Value')).toBeInTheDocument();
    expect(screen.getByText('$22,500')).toBeInTheDocument();
  });

  it('displays condition impact analysis table', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText('Condition Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('5 - Excellent')).toBeInTheDocument();
    expect(screen.getByText('1 - Poor')).toBeInTheDocument();
  });

  it('shows all valuation sources', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText('Black Book')).toBeInTheDocument();
    expect(screen.getByText('KBB')).toBeInTheDocument();
    expect(screen.getByText('NADA')).toBeInTheDocument();
  });

  it('displays PDF download link when lastId is provided', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    const pdfLink = screen.getByRole('link', { name: /download pdf/i });
    expect(pdfLink).toBeInTheDocument();
    expect(pdfLink).toHaveAttribute('href', 'http://localhost:4000/api/receipt/pdf/test-123');
  });

  it('shows disclaimer footer', () => {
    render(
      <ResultsSection
        quotes={mockQuotes}
        summary={mockSummary}
        depreciation={mockDepreciation}
        lastId="test-123"
        condition={3}
      />
    );
    
    expect(screen.getByText(/Powered by Quirk AI/i)).toBeInTheDocument();
  });
});
