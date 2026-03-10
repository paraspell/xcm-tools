import type { TAssetInfo, TExchangeChain } from '@paraspell/sdk';
import { findAssetInfoOrThrow } from '@paraspell/sdk';

import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import { record } from '../exchanges/ExchangeChainFactory';
import type { TAssetsRecord, TDexConfig } from '../types';

const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeConfig = (exchange: TExchangeChain): TDexConfig => {
  const stored = assetsMap[exchange];
  const chain = record[exchange].chain;

  const assets = stored.assets.map((location) => findAssetInfoOrThrow(chain, { location }, null));

  return {
    isOmni: stored.isOmni,
    assets,
    pairs: stored.pairs,
  };
};

export const getExchangeAssets = (exchange: TExchangeChain): TAssetInfo[] => {
  return getExchangeConfig(exchange).assets;
};
