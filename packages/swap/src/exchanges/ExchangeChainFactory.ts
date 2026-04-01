import type { TExchangeChain } from '@paraspell/sdk-core';

import AcalaExchange from './Acala/AcalaExchange';
import AssetHubExchange from './AssetHub/AssetHubExchange';
import BifrostExchange from './Bifrost/BifrostExchange';
import type ExchangeChain from './ExchangeChain';
import HydrationExchange from './Hydration/HydrationExchange';

export const record: Record<TExchangeChain, ExchangeChain> = {
  // Reuse classes for Kusama equivalents
  AssetHubPolkadot: new AssetHubExchange('AssetHubPolkadot'),
  AssetHubKusama: new AssetHubExchange('AssetHubKusama'),
  AssetHubPaseo: new AssetHubExchange('AssetHubPaseo'),
  AssetHubWestend: new AssetHubExchange('AssetHubWestend'),
  Hydration: new HydrationExchange('Hydration'),
  Acala: new AcalaExchange('Acala'),
  Karura: new AcalaExchange('Karura'),
  BifrostPolkadot: new BifrostExchange('BifrostPolkadot'),
  BifrostKusama: new BifrostExchange('BifrostKusama'),
};

export const createExchangeInstance = (chain: TExchangeChain): ExchangeChain => record[chain];
