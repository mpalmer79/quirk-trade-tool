import React from 'react';

export function FeaturesSection() {
  const features = [
    { 
      icon: '⚡', 
      title: 'Instant Results', 
      desc: 'Get valuations in seconds with automatic VIN decoding' 
    },
    { 
      icon: '🎯', 
      title: 'Transparent Pricing', 
      desc: 'Clear condition-based depreciation factors visible to your team' 
    },
    { 
      icon: '🔒', 
      title: 'Multi-Source Accuracy', 
      desc: 'Aggregated data from 6+ industry-leading valuation providers' 
    }
  ];

  return (
    <>
      {/* FEATURES SECTION */}
      <div className="relative bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Quirk Trade Tool</h2>
          <div className="w-20 h-1 bg-[#00d9a3] mx-auto"></div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">{feat.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feat.title}</h3>
              <p className="text-gray-600">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="bg-gradient-to-br from-[#001a4d] to-[#003d99] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Trade-In Process?</h2>
          <p className="text-gray-200 mb-8 text-lg">Join Quirk Auto Dealers in getting accurate, transparent, condition-adjusted valuations in seconds.</p>
          <a href="mailto:mpalmer@quirkcars.com" className="inline-block px-8 py-4 bg-[#00d9a3] hover:bg-[#00b87d] text-[#001a4d] font-bold rounded-lg transition-all text-lg">
            Contact Us Today
          </a>
        </div>
      </div>
    </>
  );
}
