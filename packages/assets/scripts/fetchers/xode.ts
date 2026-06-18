import type { TLocation } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { fetchAssetsPalletAssets } from '../utils'

const locationMap: Record<string, TLocation> = {
  DOT: { parents: 1, interior: { Here: null } },
  USDT: {
    parents: 1,
    interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
  }
}

export const fetchXodeAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const assets = await fetchAssetsPalletAssets(client, (_id, symbol) => locationMap[symbol.toUpperCase()])
  return assets.filter(a => a.symbol.toUpperCase() !== 'GEM')
}
