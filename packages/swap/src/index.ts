import { registerSwapExtension } from '@paraspell/sdk';

import { RouterBuilder } from './builder/RouterBuilder';

// @ts-expect-error - Temporary fix till the release to implement breaking changes
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
