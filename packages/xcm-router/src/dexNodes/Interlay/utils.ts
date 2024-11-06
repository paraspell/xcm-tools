import { type InterBtcApi, type CurrencyExt } from 'inter-exchange';
import type { TCurrencyCoreV1 } from '@paraspell/sdk';
import { type TNode, getAssetId } from '@paraspell/sdk';

export const getCurrency = async (
  currency: TCurrencyCoreV1,
  interBTC: InterBtcApi,
  node: TNode,
): Promise<CurrencyExt | null> => {
  if ('symbol' in currency) {
    const { symbol } = currency;
    if (symbol === 'DOT' || symbol === 'KSM') {
      return interBTC.getRelayChainCurrency();
    } else if (symbol === 'INTR' || symbol === 'KINT') {
      return interBTC.getGovernanceCurrency();
    } else if (symbol === 'IBTC' || symbol === 'KBTC') {
      return interBTC.getWrappedCurrency();
    }
    const id = getAssetId(node, symbol);
    if (id === null) return null;
    return await interBTC.assetRegistry.getForeignAsset(Number(id));
  } else {
    return await interBTC.assetRegistry.getForeignAsset(Number(currency.id));
  }
};
