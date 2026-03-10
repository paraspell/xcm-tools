/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getAssets, localizeLocation, type TParachain } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfigStored } from '../../../types';
import { capitalizeLocation } from './capitalizeLocation';

export const getDexConfig = async (
  api: ApiPromise,
  chain: TParachain,
): Promise<TDexConfigStored> => {
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
      poolLocations.has(JSON.stringify(localizeLocation('AssetHubPolkadot', asset.location))),
  );

  const locations = filteredAssets.map((asset) => asset.location);

  return {
    isOmni: true,
    assets: locations,
    pairs: [],
  };
};
