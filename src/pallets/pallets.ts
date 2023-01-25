import * as palletsMapJson from '../maps/pallets.json' assert { type: 'json' }
import { TNode, TPallet, TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

export function getDefaultPallet(node: TNode): TPallet {
  return palletsMap[node].defaultPallet
}

export function getSupportedPallets(node: TNode): TPallet[] {
  return palletsMap[node].supportedPallets
}
