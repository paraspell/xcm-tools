import type { TPapiApi } from '@paraspell/sdk';
import { getAssets, localizeLocation, type TParachain } from '@paraspell/sdk-core';

import type { TDexConfigStored } from '../../../types';
import { replaceBigIntNumeric } from '../../../utils';
import { papiLocationToJson } from './papiLocationToJson';

export const getDexConfig = async (api: TPapiApi, chain: TParachain): Promise<TDexConfigStored> => {
  const assets = getAssets(chain);

  const entries = (await api
    .getUnsafeApi()
    .query.AssetConversion.Pools.getEntries()) as unknown as { keyArgs: [[object, object]] }[];

  const poolLocations = new Set<string>();
  entries.forEach(({ keyArgs: [[ml1, ml2]] }) => {
    poolLocations.add(JSON.stringify(papiLocationToJson(ml1), replaceBigIntNumeric));
    poolLocations.add(JSON.stringify(papiLocationToJson(ml2), replaceBigIntNumeric));
  });

  const filteredAssets = assets.filter(
    (asset) =>
      poolLocations.has(JSON.stringify(asset.location, replaceBigIntNumeric)) ||
      poolLocations.has(
        JSON.stringify(localizeLocation('AssetHubPolkadot', asset.location), replaceBigIntNumeric),
      ),
  );

  return {
    isOmni: true,
    assets: filteredAssets.map((asset) => asset.location),
    pairs: [],
  };
};
