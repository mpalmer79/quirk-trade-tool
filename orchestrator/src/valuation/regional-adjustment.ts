import type { AppraiseInput } from '../schemas/appraise.js';

interface RegionConfig {
  name: string;
  baseMultiplier: number;
  seasonalMultipliers: {
    winter: number;    // Dec-Feb
    spring: number;    // Mar-May
    summer: number;    // Jun-Aug
    fall: number;      // Sep-Nov
  };
  vehicleTypeMultipliers: {
    convertible: number;
    awd: number;
    rwd: number;
    truck: number;
    suv: number;
  };
}

const REGIONS: Record<string, RegionConfig> = {
  'northeast': {
    name: 'Northeast (NH, MA, ME, VT, etc.)',
    baseMultiplier: 0.98,  // Generally 2% lower than national average
    seasonalMultipliers: {
      winter: 0.92,  // 8% discount in winter
      spring: 1.00,  // No adjustment
      summer: 1.02,  // 2% premium in summer
      fall: 0.98,    // 2% discount in fall
    },
    vehicleTypeMultipliers: {
      convertible: 0.90,  // 10% discount - low demand
      awd: 1.05,          // 5% premium - high demand
      rwd: 0.95,          // 5% discount - winter concerns
      truck: 1.03,        // 3% premium - utility demand
      suv: 1.02,          // 2% premium - family preference
    }
  }
};

const ZIP_TO_REGION: Record<string, string> = {
  // Massachusetts - Greater Boston
  '02122': 'northeast',  // Dorchester (hardcoded in frontend)
  '02101': 'northeast',  // Boston
  '02108': 'northeast',  // Boston
  '02109': 'northeast',  // Boston
  '02110': 'northeast',  // Boston
  '02111': 'northeast',  // Boston
  '02112': 'northeast',  // Boston
  '02113': 'northeast',  // Boston
  '02114': 'northeast',  // Boston
  '02115': 'northeast',  // Boston
  '02116': 'northeast',  // Boston
  '02117': 'northeast',  // Boston
  '02118': 'northeast',  // Boston
  '02119': 'northeast',  // Boston
  '02120': 'northeast',  // Boston
  '02121': 'northeast',  // Boston
  '02123': 'northeast',  // Boston
  '02124': 'northeast',  // Boston
  '02125': 'northeast',  // Boston
  '02126': 'northeast',  // Boston
  '02127': 'northeast',  // Boston
  '02128': 'northeast',  // Boston
  '02129': 'northeast',  // Boston
  '02130': 'northeast',  // Boston
  '02131': 'northeast',  // Boston
  '02132': 'northeast',  // Boston
  '02133': 'northeast',  // Boston
  '02134': 'northeast',  // Boston
  '02135': 'northeast',  // Boston
  
  // New Hampshire
  '03031': 'northeast',  // Manchester (Quirk Chevrolet)
  '03101': 'northeast',  // Manchester
  '03102': 'northeast',  // Manchester
  '03103': 'northeast',  // Manchester
  '03104': 'northeast',  // Manchester
  '03105': 'northeast',  // Manchester
  '03106': 'northeast',  // Manchester
  '03107': 'northeast',  // Manchester
  '03108': 'northeast',  // Manchester
  '03109': 'northeast',  // Manchester
  '03110': 'northeast',  // Manchester
  '03301': 'northeast',  // Concord
  '03302': 'northeast',  // Concord
  '03303': 'northeast',  // Concord
  '03304': 'northeast',  // Concord
  '03801': 'northeast',  // Portsmouth
  '03802': 'northeast',  // Portsmouth
  '03803': 'northeast',  // Portsmouth
};

function getRegionFromZip(zip?: string): string {
  if (!zip) return 'national';  // Default to no adjustment
  return ZIP_TO_REGION[zip] || 'national';
}

function getCurrentSeason(): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = new Date().getMonth(); // 0-11
  if (month >= 11 || month <= 1) return 'winter';  // Dec-Feb
  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  return 'fall';                                    // Sep-Nov
}

function getVehicleType(input: AppraiseInput): keyof RegionConfig['vehicleTypeMultipliers'] | null {
  const make = input.make.toLowerCase();
  const model = input.model.toLowerCase();
  
  // Check for convertibles
  if (model.includes('convertible') || model.includes('cabriolet') || 
      model.includes('roadster') || model.includes('spyder')) {
    return 'convertible';
  }
  
  // Check for trucks
  if (model.includes('silverado') || model.includes('f-150') || 
      model.includes('ram 1500') || model.includes('tundra') ||
      model.includes('sierra') || model.includes('f-250') ||
      model.includes('f-350') || model.includes('ram 2500') ||
      model.includes('ram 3500') || model.includes('titan') ||
      model.includes('frontier') || model.includes('colorado') ||
      model.includes('canyon') || model.includes('ranger') ||
      model.includes('tacoma') || model.includes('gladiator')) {
    return 'truck';
  }
  
  // Check for SUVs
  if (model.includes('tahoe') || model.includes('suburban') || 
      model.includes('explorer') || model.includes('highlander') ||
      model.includes('pilot') || model.includes('expedition') ||
      model.includes('durango') || model.includes('traverse') ||
      model.includes('ascent') || model.includes('telluride') ||
      model.includes('palisade') || model.includes('yukon') ||
      model.includes('escalade') || model.includes('pathfinder') ||
      model.includes('armada') || model.includes('sequoia') ||
      model.includes('4runner')) {
    return 'suv';
  }
  
  // Check for AWD badges in options
  const hasAWD = input.options?.some(opt => 
    opt.toLowerCase().includes('awd') || 
    opt.toLowerCase().includes('4wd') ||
    opt.toLowerCase().includes('all-wheel drive') ||
    opt.toLowerCase().includes('quattro') ||
    opt.toLowerCase().includes('xdrive')
  );
  if (hasAWD) return 'awd';
  
  // Default to RWD for sports cars, luxury brands
  const sportsLuxuryMakes = ['bmw', 'mercedes', 'porsche', 'corvette', 'mustang', 'camaro', 'challenger', 'charger'];
  if (sportsLuxuryMakes.some(m => make.includes(m) || model.includes(m))) {
    return 'rwd';
  }
  
  return null;  // No specific type adjustment
}

export function getRegionalAdjustment(input: AppraiseInput): number {
  if (!input.zip) {
    return 1.0;  // No adjustment if ZIP not provided
  }
  
  const regionKey = getRegionFromZip(input.zip);
  if (regionKey === 'national') {
    return 1.0;  // No adjustment for unknown regions
  }
  
  const region = REGIONS[regionKey];
  if (!region) {
    return 1.0;  // Safety fallback
  }
  
  // Start with base regional multiplier
  let adjustment = region.baseMultiplier;
  
  // Apply seasonal adjustment
  const season = getCurrentSeason();
  adjustment *= region.seasonalMultipliers[season];
  
  // Apply vehicle type adjustment
  const vehicleType = getVehicleType(input);
  if (vehicleType) {
    adjustment *= region.vehicleTypeMultipliers[vehicleType];
  }
  
  console.log(`📍 Regional Adjustment for ZIP ${input.zip}:`, {
    region: region.name,
    season,
    vehicleType,
    baseMultiplier: region.baseMultiplier,
    seasonalMultiplier: region.seasonalMultipliers[season],
    vehicleTypeMultiplier: vehicleType ? region.vehicleTypeMultipliers[vehicleType] : 1.0,
    finalMultiplier: adjustment
  });
  
  return adjustment;
}
