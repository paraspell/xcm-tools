import { TMultiLocation, TNodeWithRelayChains, type TRelayChainSymbol } from '../types'

export type TAsset = TNativeAssetDetails | TAssetDetails

export type TAssetDetails = {
  assetId: string
  symbol?: string
  decimals?: number
}

export type TNativeAssetDetails = {
  assetId?: string
  symbol: string
  decimals: number
}

export type TNodeAssets = {
  paraId?: number
  relayChainAssetSymbol: TRelayChainSymbol
  nativeAssetSymbol: string
  nativeAssets: TNativeAssetDetails[]
  otherAssets: TAssetDetails[]
  multiLocations?: TMultiLocation[]
}

export type TAssetJsonMap = Record<TNodeWithRelayChains, TNodeAssets>
