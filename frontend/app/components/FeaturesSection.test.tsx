import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturesSection from './FeaturesSection';

describe('FeaturesSection Component', () => {
  it('renders the section title', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Why Choose Quirk Trade Tool')).toBeInTheDocument();
  });

  it('displays all three feature cards', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Instant Results')).toBeInTheDocument();
    expect(screen.getByText('Transparent Pricing')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Ready')).toBeInTheDocument();
  });

  it('shows feature descriptions', () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/Get valuations in seconds/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear condition-based depreciation/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure, scalable infrastructure/i)).toBeInTheDocument();
  });

  it('displays the CTA section', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Ready to Transform Your Trade-In Process?')).toBeInTheDocument();
    expect(screen.getByText(/Join Quirk Auto Dealers/i)).toBeInTheDocument();
  });

  it('shows contact email link', () => {
    render(<FeaturesSection />);
    const contactLink = screen.getByRole('link', { name: /contact us to get started/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', 'mailto:contact@quirkauto.com');
  });

  it('renders feature icons', () => {
    render(<FeaturesSection />);
    const { container } = render(<FeaturesSection />);
    // Check that emoji icons are present (they're just text)
    expect(container.textContent).toContain('⚡');
    expect(container.textContent).toContain('🎯');
    expect(container.textContent).toContain('🏢');
  });
});
