import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero Component', () => {
  it('renders the main headline', () => {
    render(<Hero />);
    expect(screen.getByText('Get Instant Wholesale Valuations')).toBeInTheDocument();
  });

  it('displays the Admin Login link', () => {
    render(<Hero />);
    const adminLink = screen.getByRole('link', { name: /admin login/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/login');
  });

  it('shows all three feature bullets', () => {
    render(<Hero />);
    expect(screen.getByText('Multi-source accuracy')).toBeInTheDocument();
    expect(screen.getByText('Real-time data')).toBeInTheDocument();
    expect(screen.getByText('VIN decoding')).toBeInTheDocument();
  });

  it('displays the branding icon and text', () => {
    render(<Hero />);
    expect(screen.getByText('Trade Valuation Tool')).toBeInTheDocument();
  });

  it('shows marketing description', () => {
    render(<Hero />);
    expect(screen.getByText(/Real-time vehicle appraisals/i)).toBeInTheDocument();
  });
});
