import { isForeignAsset } from '@paraspell/sdk-pjs';

import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TAssetsRecord, TExchangeNode, TRouterAsset } from '../types';
import { getSdkAssetByRouterAsset } from './getSdkAssetByRouterAsset';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeAssets = (exchange: TExchangeNode): TRouterAsset[] => {
  const baseNode = createDexNodeInstance(exchange).node;
  return assetsMap[exchange].map((asset) => {
    const foundAsset = getSdkAssetByRouterAsset(baseNode, asset);
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
