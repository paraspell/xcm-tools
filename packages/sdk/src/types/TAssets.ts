import { type TNode, type TRelayChainSymbol } from '../types'

export interface TAssetDetails {
  assetId: string
  symbol?: string
  decimals?: number
}
export interface TNativeAssetDetails {
  assetId?: string
  symbol: string
  decimals: number
}
export interface TNodeAssets {
  paraId: number
  relayChainAssetSymbol: TRelayChainSymbol
  nativeAssetSymbol: string
  nativeAssets: TNativeAssetDetails[]
  otherAssets: TAssetDetails[]
}
export type TAssetJsonMap = Record<TNode, TNodeAssets>
