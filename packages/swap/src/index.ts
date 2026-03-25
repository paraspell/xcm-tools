import { registerSwapExtension } from '@paraspell/sdk';

import { RouterBuilder } from './builder/RouterBuilder';

// @ts-expect-error - The RouterBuilder types do not match because of private field losing type after build.
// Will be removed after next release
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
export { createExchangeInstance } from './exchanges/ExchangeChainFactory';
export * from './transfer/buildApiTransactions';
export * from './transfer/buildTransactions';
export * from './transfer/transfer';
export * from './types';
export { EXCHANGE_CHAINS, TExchangeChain, TExchangeInput } from '@paraspell/sdk';
