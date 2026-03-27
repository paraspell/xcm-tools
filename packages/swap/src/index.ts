import { registerSwapExtension } from '@paraspell/sdk';

import { RouterBuilder } from './builder/RouterBuilder';

registerSwapExtension({ RouterBuilder });

export {
  getExchangeAssets,
  getExchangeConfig,
  getExchangePairs,
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
  getSupportedFeeAssets,
} from './assets';
export * from './builder/RouterBuilder';
export * from './consts';
export * from './types';
