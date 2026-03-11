import { type Asset, type TradeRouter } from '@galacticcouncil/sdk';
import type { TAssetInfo } from '@paraspell/sdk';

export const getAssetInfo = async (
  tradeRouter: TradeRouter,
  asset: Pick<TAssetInfo, 'symbol' | 'assetId'>,
): Promise<Asset | undefined> => {
  const assets = await tradeRouter.getAllAssets();
  return asset.assetId
    ? assets.find((a) => a.id === asset.assetId)
    : assets.find((a) => a.symbol === asset.symbol);
};
