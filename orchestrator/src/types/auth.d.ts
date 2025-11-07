// orchestrator/src/types/auth.d.ts
import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  // Augment the library type so ANY place that imports JwtPayload sees these
  export interface JwtPayload {
    // Some code uses a single id, others an array — support both.
    dealershipId?: number | string;
    dealershipIds?: Array<number | string>;
    // keep everything else allowed
    [key: string]: unknown;
  }
}
