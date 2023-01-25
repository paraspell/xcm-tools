import * as palletsMapJson from '../maps/pallets.json' assert { type: 'json' }
import { TNode, TPallet, TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

export const getDefaultPallet = (node: TNode): TPallet => {
  return palletsMap[node].defaultPallet
}

export const getSupportedPallets = (node: TNode): TPallet[] => {
  return palletsMap[node].supportedPallets
}
