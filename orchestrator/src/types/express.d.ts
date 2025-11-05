/**
 * Express Type Extensions
 * 
 * Extends Express Request interface to include custom properties
 */

import { JwtPayload } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      id?: string;
    }
  }
}

export {};
