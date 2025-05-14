import type { TForeignAsset } from '@paraspell/sdk';
import { getAssets, type TNodePolkadotKusama } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfig, TRouterAsset } from '../../../types';

export const getDexConfig = async (
  api: ApiPromise,
  node: TNodePolkadotKusama,
): Promise<TDexConfig> => {
  const assets = getAssets(node) as TForeignAsset[];
  const transformedAssets: TRouterAsset[] = assets.map((asset) => ({
    symbol: asset.symbol,
    assetId: asset.assetId,
    multiLocation: asset.multiLocation,
  }));

  const response = await api.query.assetConversion.pools.entries();

  const pairs = response.map(
    ([
      {
        args: [era],
      },
    ]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const [ml1, ml2] = era.toJSON() as any;
      return [ml1, ml2];
    },
  ) as [object, object][];

  return Promise.resolve({
    isOmni: false,
    assets: transformedAssets,
    pairs,
  });
};
