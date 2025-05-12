import type { TMultiLocation, TNodeWithRelayChains, TRelayChainSymbol } from '@paraspell/sdk-common'

type AtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

type TBaseAsset = {
  symbol: string
  decimals?: number
  manuallyAdded?: boolean
  alias?: string
  existentialDeposit?: string
  isFeeAsset?: boolean
}

export type TNativeAsset = TBaseAsset & {
  isNative: true
  multiLocation?: TMultiLocation
}

export type TForeignAsset = TBaseAsset &
  AtLeastOne<{
    assetId?: string
    multiLocation?: TMultiLocation
  }>

export type TAsset = TNativeAsset | TForeignAsset

export type TNodeAssets = {
  relayChainAssetSymbol: TRelayChainSymbol
  nativeAssetSymbol: string
  isEVM: boolean
  ss58Prefix: number
  supportsDryRunApi: boolean
  supportsXcmPaymentApi: boolean
  nativeAssets: TNativeAsset[]
  otherAssets: TForeignAsset[]
}

export type TAssetJsonMap = Record<TNodeWithRelayChains, TNodeAssets>
