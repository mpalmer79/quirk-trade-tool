import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    dealershipId?: number | string;
    dealershipIds?: Array<number | string>;
    [key: string]: unknown;
  }
}
