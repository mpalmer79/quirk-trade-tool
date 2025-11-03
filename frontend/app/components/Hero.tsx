import React from 'react';
import Link from 'next/link';
import { ScanLine, CheckCircle2 } from 'lucide-react';

const WaveDivider = () => (
  <svg className="w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 Q300,10 600,50 T1200,50 L1200,120 L0,120 Z" fill="white" />
  </svg>
);

export function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-[#001a4d] to-[#003d99] text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d9a3] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00d9a3] rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20">
        {/* HEADER WITH LOGO */}
        <div className="flex items-start justify-between mb-12">
          {/* Left side: branding */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <ScanLine className="w-10 h-10 text-[#00d9a3]" />
              <span className="text-[#00d9a3] font-semibold text-sm tracking-widest uppercase">Trade Valuation Tool</span>
            </div>
          </div>

          {/* ⚠️ CRITICAL: DO NOT REMOVE - Admin Login Link Required */}
          {/* This link provides the only access point to the admin dashboard */}
          <div className="flex-shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition text-white font-medium text-sm backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Admin Login</span>
            </Link>
          </div>
        </div>

        {/* Main headline and description */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Get Instant Wholesale Valuations
        </h1>
        <p className="text-xl text-gray-200 max-w-2xl mb-8">
          Real-time vehicle appraisals powered by Black Book, KBB, NADA, Manheim, and more. Accurate, transparent pricing with condition-based adjustments.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
            <span>Multi-source accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
            <span>Real-time data</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00d9a3]" />
            <span>VIN decoding</span>
          </div>
        </div>
      </div>

      <WaveDivider />
    </div>
  );
}
