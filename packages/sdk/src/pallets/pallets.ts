// Script that pulls XCM Pallets for selected Parachain

import * as palletsMapJson from '../maps/pallets.json' assert { type: 'json' }
import { TNodePolkadotKusama, type TPallet, type TPalletJsonMap } from '../types'

const palletsMap = palletsMapJson as TPalletJsonMap

export const getDefaultPallet = (node: TNodePolkadotKusama): TPallet => {
  return palletsMap[node].defaultPallet
}

export const getSupportedPallets = (node: TNodePolkadotKusama): TPallet[] => {
  return palletsMap[node].supportedPallets
}
