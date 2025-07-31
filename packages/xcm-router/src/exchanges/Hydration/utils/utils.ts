import { type Asset, type TradeRouter } from '@galacticcouncil/sdk';

import type { TRouterAsset } from '../../../types';

export const getAssetInfo = async (
  tradeRouter: TradeRouter,
  asset: TRouterAsset,
): Promise<Asset | undefined> => {
  const assets = await tradeRouter.getAllAssets();
  return asset.assetId
    ? assets.find((a) => a.id === asset.assetId)
    : assets.find((a) => a.symbol === asset.symbol);
};
