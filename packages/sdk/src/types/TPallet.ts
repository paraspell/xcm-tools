import { type SUPPORTED_PALLETS } from '../maps/consts'
import { type TNode } from './TNode'

export type TPallet = (typeof SUPPORTED_PALLETS)[number]
export interface TPalletMap {
  defaultPallet: TPallet
  supportedPallets: TPallet[]
}
export type TPalletJsonMap = Record<TNode, TPalletMap>
