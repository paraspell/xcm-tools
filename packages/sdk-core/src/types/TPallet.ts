import { type SUPPORTED_PALLETS } from '../constants'
import type { TNodeDotKsmWithRelayChains } from './TNode'

export type TPallet = (typeof SUPPORTED_PALLETS)[number]
export type TPalletDetails = {
  name: TPallet
  index: number
}
export interface TPalletMap {
  defaultPallet: TPallet
  supportedPallets: TPalletDetails[]
}
export type TPalletJsonMap = Record<TNodeDotKsmWithRelayChains, TPalletMap>
