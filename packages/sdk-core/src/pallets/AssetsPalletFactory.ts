import type { TAssetsPallet } from '@paraspell/pallets'

import type { BaseAssetsPallet } from '../types/TAssets'
import { AssetManagerPallet } from './assetManager'
import { AssetsPallet } from './assets'
import { BalancesPallet } from './balances'
import { CurrenciesPallet } from './currencies'
import { ForeignAssetsPallet } from './foreignAssets'
import { FungiblesPallet } from './fungibles'
import { SystemPallet } from './system'
import { TokensPallet } from './tokens'

const palletRegistry: Record<TAssetsPallet, BaseAssetsPallet> = {
  Balances: new BalancesPallet('Balances'),
  Tokens: new TokensPallet('Tokens'),
  OrmlTokens: new TokensPallet('OrmlTokens'),
  Currencies: new CurrenciesPallet('Currencies'),
  Assets: new AssetsPallet('Assets'),
  ForeignAssets: new ForeignAssetsPallet('ForeignAssets'),
  AssetManager: new AssetManagerPallet('AssetManager'),
  System: new SystemPallet('System'),
  Fungibles: new FungiblesPallet('Fungibles')
}

export const getPalletInstance = (type: TAssetsPallet) => palletRegistry[type]
