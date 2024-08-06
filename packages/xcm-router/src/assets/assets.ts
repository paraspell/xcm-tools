import * as assetsMapJson from '../consts/assets.json' assert { type: 'json' };
import type { TAssetsRecord, TExchangeNode } from '../types';

const assetsMap = assetsMapJson as TAssetsRecord;

export const supportsCurrency = (exchangeNode: TExchangeNode, currency: string): boolean => {
  return assetsMap[exchangeNode].some((asset) => asset === currency);
};
