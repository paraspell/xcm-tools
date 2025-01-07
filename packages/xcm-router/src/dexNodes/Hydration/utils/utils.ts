import type { BigNumber } from '@galacticcouncil/sdk';
import { type TradeRouter, bnum, type Asset } from '@galacticcouncil/sdk';
import type { TCurrencyCoreV1 } from '@paraspell/sdk-pjs';

export const PCT_100 = bnum('100');

export const calculateSlippage = (amount: BigNumber, slippagePct: string) => {
  const slippage = amount.div(PCT_100).multipliedBy(slippagePct);
  return slippage.decimalPlaces(0, 1);
};

export const getMinAmountOut = (
  amountOut: BigNumber,
  assetOutDecimals: number,
  slippagePct: string,
): { amount: BigNumber; decimals: number } => {
  const slippage = calculateSlippage(amountOut, slippagePct);
  const minAmountOut = amountOut.minus(slippage);

  return {
    amount: minAmountOut,
    decimals: assetOutDecimals,
  };
};

export const getAssetInfo = async (
  tradeRouter: TradeRouter,
  currency: TCurrencyCoreV1,
): Promise<Asset | undefined> => {
  const assets = await tradeRouter.getAllAssets();

  if (
    assets.filter((asset) =>
      'symbol' in currency ? asset.symbol === currency.symbol : asset.id === currency.id,
    ).length > 1
  ) {
    throw new Error('Duplicate currency found in HydrationDex.');
  }

  return 'symbol' in currency
    ? assets.find((asset) => asset.symbol === currency.symbol)
    : assets.find((asset) => asset.id === currency.id);
};
