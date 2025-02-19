import type { TNodePolkadotKusama, TMultiLocation, TJunction, TAsset } from '@paraspell/sdk-pjs';
import { deepEqual, getOtherAssets } from '@paraspell/sdk-pjs';
import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAssetsRecord, TExchangeNode } from '../types';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeAssets = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
): TAsset[] => {
  return assetsMap[exchange].map((asset) => {
    const foundAsset = getOtherAssets(exchangeBaseNode).find(
      (otherAsset) => otherAsset.assetId === asset.id,
    );
    return {
      ...asset,
      ...(asset.id !== undefined ? { assetId: asset.id } : {}),
      ...(foundAsset?.multiLocation !== undefined
        ? { multiLocation: foundAsset.multiLocation }
        : {}),
    } as TAsset;
  });
};

export const extractJunctions = (multiLocation: TMultiLocation): TJunction[] => {
  const { interior } = multiLocation;

  if (interior === 'Here') return [];

  const xKey = Object.keys(interior).find((key) => key.startsWith('X'));
  return xKey ? (interior as Record<string, TJunction[]>)[xKey] : [];
};

export const compareXcmInteriors = (
  value: TJunction[] | undefined,
  other: TJunction[] | undefined,
) => {
  if (value === undefined || other === undefined) return false;
  const filterJunctions = (junctions: TJunction[]) =>
    junctions.filter((junction) => !('Network' in junction));

  const filteredValue = filterJunctions(value);
  const filteredOther = filterJunctions(other);

  if (filteredValue.length !== filteredOther.length) return false;

  return filteredValue.every((junction, index) => deepEqual(junction, filteredOther[index]));
};
