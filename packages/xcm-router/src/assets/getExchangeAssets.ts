import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAssetsRecord, TExchangeNode, TRouterAsset } from '../types';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeAssets = (exchange: TExchangeNode): TRouterAsset[] => {
  return assetsMap[exchange];
};
