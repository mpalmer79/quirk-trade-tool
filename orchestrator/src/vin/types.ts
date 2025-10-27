export type VinDecodeResult = {
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  fuelTypePrimary?: string;
  driveType?: string;
  engine?: {
    cylinders?: string;
    displacementL?: string;
  };
  errors?: string[];
  raw?: unknown; // raw provider payload for auditing
};
