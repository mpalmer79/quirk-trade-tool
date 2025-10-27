export function filterAutomotiveMakes(allMakes: string[]): string[] {
  return allMakes.filter((make: string) => {
    const makeLower = make.toLowerCase();
    
    const excludeTerms = [
      'custom', 'kustom', 'trailer', 'trailers', 'cart', 'carts',
      'coach', 'manufacturing', 'enterprises', 'industries',
      'specialty', 'conversions', 'motorhomes', 'rv',
      'golf', 'utility', 'off', 'llc', 'inc', 'ltd',
      'chopper', 'cycles', 'street', 'performance',
      'fabrication', 'design', 'concepts', 'creations'
    ];
    
    const shouldExclude = excludeTerms.some(term => {
      return makeLower.includes(term) && 
             (makeLower === term || 
              makeLower.startsWith(term + ' ') || 
              makeLower.endsWith(' ' + term) ||
              makeLower.includes(' ' + term + ' '));
    });
    
    if (shouldExclude) return false;
    if (makeLower.length < 3) return false;
    if (/^\d+$/.test(makeLower)) return false;
    
    return true;
  });
}

export function filterMotorcycleMakes(motorcycleData: any[]): string[] {
  const motorcycleBrands = ['harley-davidson', 'indian', 'harley davidson'];
  
  return motorcycleData
    .map((item: any) => item.MakeName)
    .filter((make: string) => 
      motorcycleBrands.some(brand => 
        make.toLowerCase().includes(brand)
      )
    );
}
