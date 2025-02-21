import type { TNodeWithRelayChains } from '../types'
import { type TRelayChainSymbol } from '../types'

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
}

export type TNativeAsset = TBaseAsset & {
  isNative: true
  multiLocation?: object
}

export type TForeignAsset = TBaseAsset &
  AtLeastOne<{
    assetId?: string
    multiLocation?: object
  }>

export type TAsset = TNativeAsset | TForeignAsset

export type TNodeAssets = {
  relayChainAssetSymbol: TRelayChainSymbol
  nativeAssetSymbol: string
  isEVM: boolean
  supportsDryRunApi: boolean
  nativeAssets: TNativeAsset[]
  otherAssets: TForeignAsset[]
}

export type TAssetJsonMap = Record<TNodeWithRelayChains, TNodeAssets>
