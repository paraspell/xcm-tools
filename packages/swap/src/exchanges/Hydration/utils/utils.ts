import type { Asset } from '@galacticcouncil/sdk-next';
import type { AssetClient } from '@galacticcouncil/sdk-next/client';
import type { TAssetInfo } from '@paraspell/sdk-core';

export const getAssetInfo = async (
  assetClient: AssetClient,
  asset: Pick<TAssetInfo, 'symbol' | 'assetId'>,
): Promise<Asset | undefined> => {
  const assets = await assetClient.getSupported();
  return asset.assetId
    ? assets.find((a) => a.id.toString() === asset.assetId)
    : assets.find((a) => a.symbol === asset.symbol);
};
