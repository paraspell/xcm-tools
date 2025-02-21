import { isForeignAsset, type TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAssetsRecord, TExchangeNode, TRouterAsset } from '../types';
import { getSdkAssetByRouterAsset } from './getSdkAssetByRouterAsset';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeAssets = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
): TRouterAsset[] => {
  return assetsMap[exchange].map((asset) => {
    const foundAsset = getSdkAssetByRouterAsset(exchangeBaseNode, asset);
    return {
      ...asset,
      ...(foundAsset && isForeignAsset(foundAsset) && foundAsset.assetId
        ? { id: foundAsset.assetId }
        : {}),
      ...(foundAsset?.multiLocation !== undefined
        ? { multiLocation: foundAsset.multiLocation }
        : {}),
    };
  });
};
