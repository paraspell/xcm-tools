import type { TChain, TLocation } from '@paraspell/sdk-common'

type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type TBaseAssetInfo = {
  symbol: string
  decimals: number
  manuallyAdded?: boolean
  alias?: string
  existentialDeposit?: string
  isFeeAsset?: boolean
}

export type TNativeAssetInfo = TBaseAssetInfo & {
  isNative: true
  location?: TLocation
}

export type TForeignAssetInfo = TBaseAssetInfo &
  AtLeastOne<{
    assetId?: string
    location?: TLocation
  }>

export type TForeignAssetWithId = TForeignAssetInfo & {
  assetId: string
}

export type TAssetInfo = TNativeAssetInfo | TForeignAssetInfo

export type TAssetWithLocation = TAssetInfo & {
  location: TLocation
}

export type TChainAssetsInfo = {
  relaychainSymbol: string
  nativeAssetSymbol: string
  isEVM: boolean
  ss58Prefix: number
  supportsDryRunApi: boolean
  supportsXcmPaymentApi: boolean
  nativeAssets: TNativeAssetInfo[]
  otherAssets: TForeignAssetInfo[]
}

export type TAssetJsonMap = Record<TChain, TChainAssetsInfo>
