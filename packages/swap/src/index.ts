import { registerSwapExtension } from '@paraspell/sdk';

import { RouterBuilder } from './builder/RouterBuilder';

// @ts-expect-error - Temporary. Will be removed once the swap extension is fully integrated into the SDK.
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
