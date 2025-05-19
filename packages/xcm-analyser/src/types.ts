import type { z } from 'zod';

import type {
  JunctionAccountId32,
  JunctionAccountIndex64,
  JunctionAccountKey20,
  JunctionGeneralIndex,
  JunctionGeneralKey,
  JunctionGlobalConsensus,
  JunctionOnlyChild,
  JunctionPalletInstance,
  JunctionParachain,
  JunctionPlurality,
  JunctionSchema,
  MultiLocationSchema,
} from './schema';

export type JunctionType =
  | 'Parachain'
  | 'AccountId32'
  | 'AccountIndex64'
  | 'AccountKey20'
  | 'PalletInstance'
  | 'GeneralIndex'
  | 'GeneralKey'
  | 'OnlyChild'
  | 'Plurality'
  | 'GlobalConsensus';

export type TJunctionParachain = z.infer<typeof JunctionParachain>;
export type TJunctionAccountId32 = z.infer<typeof JunctionAccountId32>;
export type TJunctionAccountIndex64 = z.infer<typeof JunctionAccountIndex64>;
export type TJunctionAccountKey20 = z.infer<typeof JunctionAccountKey20>;
export type TJunctionPalletInstance = z.infer<typeof JunctionPalletInstance>;
export type TJunctionGeneralIndex = z.infer<typeof JunctionGeneralIndex>;
export type TJunctionGeneralKey = z.infer<typeof JunctionGeneralKey>;
export type TJunctionOnlyChild = z.infer<typeof JunctionOnlyChild>;
export type TJunctionPlurality = z.infer<typeof JunctionPlurality>;
export type TJunctionGlobalConsensus = z.infer<typeof JunctionGlobalConsensus>;

export type MultiLocation = z.infer<typeof MultiLocationSchema>;
export type Junction = z.infer<typeof JunctionSchema>;
