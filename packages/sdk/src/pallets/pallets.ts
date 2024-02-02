// Script that pulls XCM Pallets for selected Parachain

import * as palletsMapJson from '../maps/pallets.json' assert { type: 'json' }
import { type TNode, type TPallet, type TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

export const getDefaultPallet = (node: TNode): TPallet => {
  return palletsMap[node].defaultPallet
}

export const getSupportedPallets = (node: TNode): TPallet[] => {
  return palletsMap[node].supportedPallets
}
