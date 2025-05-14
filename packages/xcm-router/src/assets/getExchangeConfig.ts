import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAssetsRecord, TDexConfig, TExchangeNode, TRouterAsset } from '../types';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeConfig = (exchange: TExchangeNode): TDexConfig => {
  return assetsMap[exchange];
};

export const getExchangeAssets = (exchange: TExchangeNode): TRouterAsset[] => {
  return getExchangeConfig(exchange).assets;
};
