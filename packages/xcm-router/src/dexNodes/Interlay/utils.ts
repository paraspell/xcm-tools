import { type InterBtcApi } from 'inter-exchange';

import type { TRouterAsset } from '../../types';

export const getCurrency = async (interBTC: InterBtcApi, asset: TRouterAsset) => {
  if (asset.assetId) {
    return interBTC.assetRegistry.getForeignAsset(Number(asset.assetId));
  } else {
    const { symbol } = asset;
    if (symbol === 'DOT' || symbol === 'KSM') {
      return interBTC.getRelayChainCurrency();
    } else if (symbol === 'INTR' || symbol === 'KINT') {
      return interBTC.getGovernanceCurrency();
    } else if (symbol === 'IBTC' || symbol === 'KBTC') {
      return interBTC.getWrappedCurrency();
    }
    return null;
  }
};
