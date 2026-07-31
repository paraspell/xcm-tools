import type { TChain, TCustomCtx, TExchangeChain, TRelaychain } from '@paraspell/sdk-core';
import {
  getChain,
  getNativeAssetSymbolImpl,
  getRelayChainSymbolImpl,
  isCustomChain,
  RELAYCHAINS,
} from '@paraspell/sdk-core';

const getEcosystem = <TCustomChain extends string>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx,
): TRelaychain | undefined => {
  if (!isCustomChain(chain)) {
    return getChain(chain).ecosystem;
  }

  const relaySymbol = getRelayChainSymbolImpl(chain, ctx);
  return RELAYCHAINS.find((relay) => getNativeAssetSymbolImpl(relay) === relaySymbol);
};

export const filterCompatibleExchanges = <TCustomChain extends string>(
  exchanges: readonly TExchangeChain[],
  chain: TChain | TCustomChain | undefined,
  ctx?: TCustomCtx,
): TExchangeChain[] => {
  if (chain === undefined) {
    return [...exchanges];
  }

  const ecosystem = getEcosystem(chain, ctx);
  return ecosystem === undefined
    ? []
    : exchanges.filter((exchange) => getChain(exchange).ecosystem === ecosystem);
};
