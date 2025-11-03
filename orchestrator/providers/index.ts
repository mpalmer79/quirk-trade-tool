/**
 * Provider Registry
 * Single source of truth for all valuation providers
 */

import { BlackBookProvider } from './black-book-provider';
import { KBBProvider } from './kbb-provider';
import { NADAProvider } from './nada-provider';
import { ManheimProvider } from './manheim-provider';
import { AuctionEdgeProvider } from './auction-edge-provider';
import { QuincyAutoProvider } from './quincy-auto-provider';

export const providers = [
  new BlackBookProvider(),
  new KBBProvider(),
  new NADAProvider(),
  new ManheimProvider(),
  new AuctionEdgeProvider(),
  new QuincyAutoProvider(),
];

export * from './base-provider';
