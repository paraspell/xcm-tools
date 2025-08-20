import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { ASSETS_PALLETS, PALLETS } from '../constants'

export type TPallet = (typeof PALLETS)[number]
export type TAssetsPallet = (typeof ASSETS_PALLETS)[number]

export type TPalletDetails = {
  name: TPallet
  index: number
}
export interface TPalletMap {
  defaultPallet: TPallet
  supportedPallets: TPalletDetails[]
  nativeAssets: TAssetsPallet
  otherAssets: TAssetsPallet[]
}
export type TPalletJsonMap = Record<TSubstrateChain, TPalletMap>
