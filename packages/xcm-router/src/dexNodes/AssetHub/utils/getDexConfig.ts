/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TForeignAsset, TMultiLocation } from '@paraspell/sdk-pjs';
import { getAssets, type TNodePolkadotKusama, transformMultiLocation } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfig, TRouterAsset } from '../../../types';
import { capitalizeMultiLocation } from './capitalizeMultiLocation';

export const getDexConfig = async (
  api: ApiPromise,
  node: TNodePolkadotKusama,
): Promise<TDexConfig> => {
  const assets = getAssets(node) as TForeignAsset[];

  const response = await api.query.assetConversion.pools.entries();

  const pairs = response.map(
    ([
      {
        args: [era],
      },
    ]) => {
      const [ml1, ml2] = era.toJSON() as any;
      return [ml1, ml2];
    },
  ) as [object, object][];

  const poolMultiLocations = new Set<string>();
  pairs.forEach(([ml1, ml2]) => {
    const ml1Transformed = capitalizeMultiLocation(ml1);
    const ml2Transformed = capitalizeMultiLocation(ml2);

    poolMultiLocations.add(JSON.stringify(ml1Transformed));
    poolMultiLocations.add(JSON.stringify(ml2Transformed));
  });

  const filteredAssets = assets.filter(
    (asset) =>
      poolMultiLocations.has(JSON.stringify(asset.multiLocation)) ||
      poolMultiLocations.has(
        JSON.stringify(transformMultiLocation(asset.multiLocation as TMultiLocation)),
      ),
  );

  const transformedAssets: TRouterAsset[] = filteredAssets.map((asset) => ({
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
