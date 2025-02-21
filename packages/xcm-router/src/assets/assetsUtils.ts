import type { TNodePolkadotKusama, TAsset } from '@paraspell/sdk-pjs';
import { getOtherAssets } from '@paraspell/sdk-pjs';
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
