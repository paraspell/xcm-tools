import { registerSwapExtension } from '@paraspell/sdk';

import { SwapBuilder } from './builder/SwapBuilder';

registerSwapExtension({ SwapBuilder });

export {
  getExchangeAssets,
  getExchangeConfig,
  getExchangePairs,
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
  getSupportedFeeAssets,
} from './assets';
export * from './builder/SwapBuilder';
export * from './consts';
export * from './types';
