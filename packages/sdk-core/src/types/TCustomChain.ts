import type { TAssetInfo, TCustomAssetInfo, TCustomCtx } from '@paraspell/assets'
import type { TAssetsPallet, TCrosschainPallet, TCustomChainPallets } from '@paraspell/pallets'
import type { TRelaychain, Version } from '@paraspell/sdk-common'

import type { TProviderEntry } from './TConfig'

export type TCustomChainPalletsInput = {
  nativeAssets?: TAssetsPallet
  otherAssets?: TAssetsPallet[]
}

export type TCustomChainInput = {
  paraId: number
  ecosystem: TRelaychain
  providers: TProviderEntry[]
  xcmVersion: Version
  ss58Prefix?: number
  nativeAssetSymbol?: string
  nativeAssetDecimals?: number
  assets?: TCustomAssetInfo[]
  pallets?: TCustomChainPalletsInput
}

export type TCustomChainsMap = Record<string, TCustomChainInput>

export type TCustomChainEntry = {
  name: string
  paraId: number
  ecosystem: TRelaychain
  providers: TProviderEntry[]
  xcmVersion: Version
  ss58Prefix?: number
  nativeAssetSymbol?: string
  nativeAssetDecimals?: number
  assets: TAssetInfo[]
  pallets?: TCustomChainPallets
}

export type TCustomChainEntryHydrated = TCustomChainEntry & {
  xcmPallet: TCrosschainPallet
  isEVM: boolean
  supportsDryRunApi: boolean
  supportsXcmPaymentApi: boolean
  pallets: TCustomChainPallets
}

export type TCustomChainsCtx = Record<string, TCustomChainEntry>

export type TFullCustomCtx = TCustomCtx & {
  customChains?: TCustomChainsCtx
  customChainPallets?: Record<string, TCustomChainPallets>
}
