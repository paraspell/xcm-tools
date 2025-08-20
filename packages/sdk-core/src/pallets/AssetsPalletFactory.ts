import type { TAssetsPallet } from '@paraspell/pallets'

import type { IAssetsPallet } from '../types/TAssets'
import { AssetManagerPallet } from './assetManager'
import { AssetsPallet } from './assets/AssetsPallet'
import { BalancesPallet } from './balances'
import { CurrenciesPallet } from './currencies'
import { ForeignAssetsPallet } from './foreignAssets'
import { SystemPallet } from './system/SystemPallet'
import { TokensPallet } from './tokens'

const palletRegistry: Record<TAssetsPallet, new () => IAssetsPallet> = {
  Balances: BalancesPallet,
  Tokens: TokensPallet,
  Currencies: CurrenciesPallet,
  Assets: AssetsPallet,
  ForeignAssets: ForeignAssetsPallet,
  AssetManager: AssetManagerPallet,
  System: SystemPallet
}

export const getPalletInstance = (type: TAssetsPallet): IAssetsPallet => {
  const HandlerClass = palletRegistry[type]
  return new HandlerClass()
}
