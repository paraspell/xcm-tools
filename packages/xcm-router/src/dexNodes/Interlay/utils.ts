import { type InterBtcApi, type CurrencyExt } from 'inter-exchange';
import { type TNode, getAssetId } from '@paraspell/sdk';

export const getCurrency = async (
  symbol: string,
  interBTC: InterBtcApi,
  node: TNode,
): Promise<CurrencyExt | null> => {
  if (symbol === 'DOT' || symbol === 'KSM') {
    return interBTC.getRelayChainCurrency();
  } else if (symbol === 'INTR' || symbol === 'KINT') {
    return interBTC.getGovernanceCurrency();
  } else if (symbol === 'IBTC' || symbol === 'KBTC') {
    return interBTC.getWrappedCurrency();
  } else {
    const id = getAssetId(node, symbol);
    if (id === null) return null;
    return await interBTC.assetRegistry.getForeignAsset(Number(id));
  }
};
