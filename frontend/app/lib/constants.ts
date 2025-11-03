// Vehicle Makes
export const MAKES = [
  'Acura', 'Audi', 'BMW', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 
  'Ford', 'GMC', 'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lexus', 'Mazda', 
  'Mercedes-Benz', 'Nissan', 'Ram', 'Subaru', 'Tesla', 'Toyota', 
  'Volkswagen', 'Volvo'
];

// Models by Make
export const MODELS_BY_MAKE: Record<string, string[]> = {
  Acura: ['ILX', 'Integra', 'TLX', 'MDX', 'RDX', 'NSX'],
  Audi: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'R8', 'TT'],
  BMW: ['2 Series', '3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i4', 'iX'],
  Cadillac: ['CT4', 'CT5', 'Escalade', 'XT4', 'XT5', 'XT6', 'Lyriq'],
  Chevrolet: ['Blazer', 'Camaro', 'Colorado', 'Corvette', 'Equinox', 'Malibu', 'Silverado', 'Suburban', 'Tahoe', 'Trailblazer', 'Traverse', 'Trax'],
  Chrysler: ['300', 'Pacifica'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Hornet'],
  Ford: ['Bronco', 'Bronco Sport', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'F-350', 'Maverick', 'Mustang', 'Ranger'],
  GMC: ['Acadia', 'Canyon', 'Sierra 1500', 'Sierra 2500', 'Sierra 3500', 'Terrain', 'Yukon', 'Yukon XL'],
  Honda: ['Accord', 'Civic', 'CR-V', 'HR-V', 'Odyssey', 'Passport', 'Pilot', 'Ridgeline'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq 5', 'Ioniq 6'],
  Jeep: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Grand Wagoneer', 'Renegade', 'Wagoneer', 'Wrangler'],
  Kia: ['Forte', 'K5', 'Sportage', 'Sorento', 'Telluride', 'Seltos', 'Soul', 'EV6', 'Carnival'],
  Lexus: ['ES', 'IS', 'LS', 'GX', 'LX', 'NX', 'RX', 'UX', 'TX'],
  Mazda: ['Mazda3', 'Mazda6', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'CX-90', 'MX-5 Miata'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQB', 'EQE', 'EQS'],
  Nissan: ['Altima', 'Maxima', 'Sentra', 'Versa', 'Ariya', 'Kicks', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Frontier', 'Titan', 'Z'],
  Ram: ['1500', '2500', '3500', 'ProMaster'],
  Subaru: ['Impreza', 'Legacy', 'Outback', 'Crosstrek', 'Forester', 'Ascent', 'WRX', 'BRZ', 'Solterra'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota: ['Camry', 'Corolla', 'Avalon', 'Prius', 'RAV4', 'Highlander', '4Runner', 'Sequoia', 'Tacoma', 'Tundra', 'Sienna', 'bZ4X', 'GR86', 'Supra'],
  Volkswagen: ['Jetta', 'Passat', 'Arteon', 'Taos', 'Tiguan', 'Atlas', 'ID.4', 'Golf GTI'],
  Volvo: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40']
};

// Vehicle Options
export const OPTIONS_LIST = [
  'Navigation System',
  'Sunroof/Moonroof',
  'Leather Seats',
  'Premium Sound System',
  'Third Row Seating',
  'All-Wheel Drive',
  'Adaptive Cruise Control',
  'Heated Seats',
  'Backup Camera',
  'Towing Package'
];

// Condition Descriptions
export const CONDITION_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor - Significant damage, needs major repairs',
  2: 'Fair - Visible wear, minor damage, functional',
  3: 'Good - Normal wear, clean, well-maintained',
  4: 'Very Good - Minimal wear, excellent condition',
  5: 'Excellent - Like new, pristine condition'
};

// Condition Labels
export const CONDITION_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

// Depreciation Factors
export const DEPRECIATION_FACTORS: Record<number, number> = {
  1: 0.6,   // 40% depreciation
  2: 0.8,   // 20% depreciation
  3: 0.9,   // 10% depreciation
  4: 0.95,  // 5% depreciation
  5: 1.0    // 0% depreciation
};
