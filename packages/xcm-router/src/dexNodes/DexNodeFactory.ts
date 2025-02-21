import { type TExchangeNode } from '../types';
import AcalaExchangeNode from './Acala/AcalaDex';
import AssetHubExchangeNode from './AssetHub/AssetHubDex';
import BifrostExchangeNode from './Bifrost/BifrostDex';
import type ExchangeNode from './DexNode';
import HydrationDexExchangeNode from './Hydration/HydrationDex';
import InterlayExchangeNode from './Interlay/InterlayDex';

export const record: Record<TExchangeNode, ExchangeNode> = {
  // Reuse classes for Kusama equivalents
  AssetHubPolkadotDex: new AssetHubExchangeNode('AssetHubPolkadot', 'AssetHubPolkadotDex'),
  AssetHubKusamaDex: new AssetHubExchangeNode('AssetHubKusama', 'AssetHubKusamaDex'),
  HydrationDex: new HydrationDexExchangeNode('Hydration', 'HydrationDex'),
  AcalaDex: new AcalaExchangeNode('Acala', 'AcalaDex'),
  KaruraDex: new AcalaExchangeNode('Karura', 'KaruraDex'),
  InterlayDex: new InterlayExchangeNode('Interlay', 'InterlayDex'),
  KintsugiDex: new InterlayExchangeNode('Kintsugi', 'KintsugiDex'),
  BifrostPolkadotDex: new BifrostExchangeNode('BifrostPolkadot', 'BifrostPolkadotDex'),
  BifrostKusamaDex: new BifrostExchangeNode('BifrostKusama', 'BifrostKusamaDex'),
};

export const createDexNodeInstance = (node: TExchangeNode): ExchangeNode => record[node];
