/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TLocation } from '@paraspell/sdk-pjs';
import { getAssets, localizeLocation, type TParachain } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfig, TRouterAsset } from '../../../types';
import { capitalizeLocation } from './capitalizeLocation';

export const getDexConfig = async (api: ApiPromise, chain: TParachain): Promise<TDexConfig> => {
  const assets = getAssets(chain);

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

  const poolLocations = new Set<string>();
  pairs.forEach(([ml1, ml2]) => {
    const ml1Transformed = capitalizeLocation(ml1);
    const ml2Transformed = capitalizeLocation(ml2);

    poolLocations.add(JSON.stringify(ml1Transformed));
    poolLocations.add(JSON.stringify(ml2Transformed));
  });

  const filteredAssets = assets.filter(
    (asset) =>
      poolLocations.has(JSON.stringify(asset.location)) ||
      poolLocations.has(
        JSON.stringify(localizeLocation('AssetHubPolkadot', asset.location as TLocation)),
      ),
  );

  const transformedAssets: TRouterAsset[] = filteredAssets.map((asset) => ({
    symbol: asset.symbol,
    decimals: asset.decimals,
    assetId: asset.isNative ? undefined : asset.assetId,
    location: asset.location,
  }));

  return Promise.resolve({
    isOmni: true,
    assets: transformedAssets,
    pairs: [],
  });
};
