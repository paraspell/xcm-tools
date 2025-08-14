import { type TExchangeChain } from '../types';
import AcalaExchange from './Acala/AcalaExchange';
import AssetHubExchange from './AssetHub/AssetHubExchange';
import BifrostExchange from './Bifrost/BifrostExchange';
import type ExchangeChain from './ExchangeChain';
import HydrationExchange from './Hydration/HydrationExchange';

export const record: Record<TExchangeChain, ExchangeChain> = {
  // Reuse classes for Kusama equivalents
  AssetHubPolkadotDex: new AssetHubExchange('AssetHubPolkadot', 'AssetHubPolkadotDex'),
  AssetHubKusamaDex: new AssetHubExchange('AssetHubKusama', 'AssetHubKusamaDex'),
  HydrationDex: new HydrationExchange('Hydration', 'HydrationDex'),
  AcalaDex: new AcalaExchange('Acala', 'AcalaDex'),
  KaruraDex: new AcalaExchange('Karura', 'KaruraDex'),
  BifrostPolkadotDex: new BifrostExchange('BifrostPolkadot', 'BifrostPolkadotDex'),
  BifrostKusamaDex: new BifrostExchange('BifrostKusama', 'BifrostKusamaDex'),
};

export const createExchangeInstance = (chain: TExchangeChain): ExchangeChain => record[chain];
