/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { normalizeLocation } from '../utils/codecUtils'
import { fetchAssetsPalletAssets } from '../utils'

const LOCATION_PALLET: Partial<Record<TSubstrateChain, [string, string]>> = {
  Peaq: ['XcAssetConfig', 'AssetIdToLocation']
}

const ajunaPaseoOverrides: Record<string, TLocation> = {
  USDT: {
    parents: 1,
    interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
  }
}

export const fetchAjunaAssets = (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const [pallet, storage] = LOCATION_PALLET[chain] ?? ['AssetRegistry', 'AssetIdLocation']
  return fetchAssetsPalletAssets(client, async (id, symbol, api) => {
    const resolved = normalizeLocation(await api.query[pallet][storage].getValue(id))
    return chain === 'AjunaPaseo' ? (resolved ?? ajunaPaseoOverrides[symbol]) : resolved
  })
}
