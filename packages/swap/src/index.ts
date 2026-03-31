import { registerSwapExtension } from '@paraspell/sdk';

import { RouterBuilder } from './builder/RouterBuilder';

// Temporarily use type cast till the swap pkg dep is released and updated
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
registerSwapExtension({ RouterBuilder } as unknown as any);

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
