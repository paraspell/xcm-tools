import type { TAssetsPallet } from '@paraspell/pallets'

import type { BaseAssetsPallet } from '../types/TAssets'
import { AssetManagerPallet } from './assetManager'
import { AssetsPallet } from './assets/AssetsPallet'
import { BalancesPallet } from './balances'
import { CurrenciesPallet } from './currencies'
import { ForeignAssetsPallet } from './foreignAssets'
import { SystemPallet } from './system/SystemPallet'
import { TokensPallet } from './tokens'

const palletRegistry: Record<TAssetsPallet, BaseAssetsPallet> = {
  Balances: new BalancesPallet('Balances'),
  Tokens: new TokensPallet('Tokens'),
  Currencies: new CurrenciesPallet('Currencies'),
  Assets: new AssetsPallet('Assets'),
  ForeignAssets: new ForeignAssetsPallet('ForeignAssets'),
  AssetManager: new AssetManagerPallet('AssetManager'),
  System: new SystemPallet('System'),
  Fungibles: new AssetsPallet('Fungibles')
}

export const getPalletInstance = (type: TAssetsPallet) => palletRegistry[type]
