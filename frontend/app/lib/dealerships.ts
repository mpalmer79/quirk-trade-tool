// Edit this list to match Quirk's stores.
// id is stable (used in receipts), name is user-facing.
export type Dealership = {
  id: string;
  name: string;
  rooftop?: string;        // enterprise brand group (optional)
  address?: string;
  phone?: string;
  brand?: string;          // Chevrolet, Ford, etc.
};

export const DEALERSHIPS: Dealership[] = [
   { id: "quirk-buick-gmc-braintree", name: "Quirk Buick GMC – Braintree, MA", brand: "Buick GMC" },
  { id: "quirk-buick-gmc-manchester", name: "Quirk Buick GMC – Manchester, NH", brand: "Buick GMC" },
  { id: "quirk-chevy-braintree",  name: "Quirk Chevrolet – Braintree, MA",  brand: "Chevrolet" },
  { id: "quirk-chevy-manchester", name: "Quirk Chevrolet – Manchester, NH", brand: "Chevrolet" },
  { id: "quirk-chrysler-jeep-braintree", name: "Quirk Chrysler Jeep – Braintree, MA", brand: "Chrysler Jeep" },
  { id: "quirk-cdjr-dorchester",  name: "Quirk Chrysler Dodge Jeep Ram – Dorchester, MA", brand: "CDJR" },
  { id: "quirk-cdjr-marshfield",  name: "Quirk Chrysler Dodge Jeep Ram – Marshfield, MA", brand: "CDJR" },
  { id: "quirk-ford-quincy",      name: "Quirk Ford – Quincy, MA",          brand: "Ford" },
  { id: "genesis-braintree",      name: "Genesis of Braintree – Braintree, MA", brand: "Genesis" },
  { id: "quirk-kia-braintree",    name: "Quirk Kia – Braintree, MA",        brand: "Kia" },
  { id: "quirk-kia-manchester",   name: "Quirk Kia – Manchester, NH",       brand: "Kia" },
  { id: "quirk-kia-marshfield",   name: "Quirk Kia – Marshfield, MA",       brand: "Kia" },
  { id: "quirk-mazda-quincy",     name: "Quirk Mazda – Quincy, MA",         brand: "Mazda" },
  { id: "quirk-nissan-quincy",    name: "Quirk Nissan – Quincy, MA",        brand: "Nissan" },
  { id: "quirk-subaru-braintree", name: "Quirk Subaru – Braintree, MA",     brand: "Subaru" },
  { id: "quirk-vw-braintree",     name: "Quirk Volkswagen – Braintree, MA", brand: "Volkswagen" },
  { id: "quirk-vw-manchester",    name: "Quirk Volkswagen – Manchester, NH", brand: "Volkswagen" }
];

