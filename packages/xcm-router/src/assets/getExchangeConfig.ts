import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAssetsRecord, TDexConfig, TExchangeChain, TRouterAsset } from '../types';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeConfig = (exchange: TExchangeChain): TDexConfig => {
  return assetsMap[exchange];
};

export const getExchangeAssets = (exchange: TExchangeChain): TRouterAsset[] => {
  return getExchangeConfig(exchange).assets;
};
