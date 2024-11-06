import type { TMultiLocation, TNodeWithRelayChains } from '../types'
import { type TRelayChainSymbol } from '../types'

type TBaseAsset = {
  symbol?: string
  decimals?: number
  manuallyAdded?: boolean
  alias?: string
}

export type TNativeAsset = TBaseAsset & {
  symbol: string
}

export type TForeignAsset = TBaseAsset & {
  assetId: string
}

export type TAsset = TNativeAsset | TForeignAsset

export type TNodeAssets = {
  paraId?: number
  relayChainAssetSymbol: TRelayChainSymbol
  nativeAssetSymbol: string
  nativeAssets: TNativeAsset[]
  otherAssets: TForeignAsset[]
  multiLocations?: TMultiLocation[]
}

export type TAssetJsonMap = Record<TNodeWithRelayChains, TNodeAssets>
