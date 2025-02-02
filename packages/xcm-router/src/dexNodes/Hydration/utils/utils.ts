import type { BigNumber } from '@galacticcouncil/sdk';
import { type TradeRouter, bnum, type Asset } from '@galacticcouncil/sdk';
import { isForeignAsset, type TAsset } from '@paraspell/sdk-pjs';

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
  asset: TAsset,
): Promise<Asset | undefined> => {
  const assets = await tradeRouter.getAllAssets();
  return isForeignAsset(asset)
    ? assets.find((a) => a.id === asset.assetId)
    : assets.find((a) => a.symbol === asset.symbol);
};
