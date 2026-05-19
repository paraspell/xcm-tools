import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { ASSETS_PALLETS, CROSSCHAIN_PALLETS, PALLETS } from '../constants'

export type TPallet = (typeof PALLETS)[number]
export type TAssetsPallet = (typeof ASSETS_PALLETS)[number]
export type TCrosschainPallet = (typeof CROSSCHAIN_PALLETS)[number]

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

export type TPalletEntry = {
  name: string
  index: number
  hasExtrinsics: boolean
}

export type TCustomChainPallets = {
  nativeAssets: TAssetsPallet
  otherAssets: TAssetsPallet[]
  supportedPallets?: TPalletEntry[]
}

export type TPalletsCtx = {
  customChainPallets?: Record<string, TCustomChainPallets>
}
