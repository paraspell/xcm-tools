import type { TForeignAsset } from '@paraspell/sdk';
import { getAssets, type TNodePolkadotKusama } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfig, TRouterAsset } from '../../../types';

export const getDexConfig = async (
  _api: ApiPromise,
  node: TNodePolkadotKusama,
): Promise<TDexConfig> => {
  const assets = getAssets(node) as TForeignAsset[];
  const transformedAssets: TRouterAsset[] = assets.map((asset) => ({
    symbol: asset.symbol,
    assetId: asset.assetId,
    multiLocation: asset.multiLocation,
  }));

  return Promise.resolve({
    isOmni: true,
    assets: transformedAssets,
    pairs: [],
  });
};
