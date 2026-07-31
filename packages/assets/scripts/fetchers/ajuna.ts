/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { normalizeLocation } from '../utils/codecUtils'
import { fetchAssetsPalletAssets } from '../utils'

const LOCATION_PALLET: Partial<Record<TSubstrateChain, [string, string]>> = {
  Peaq: ['XcAssetConfig', 'AssetIdToLocation']
}

export const fetchAjunaAssets = (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const [pallet, storage] = LOCATION_PALLET[chain] ?? ['AssetRegistry', 'AssetIdLocation']
  return fetchAssetsPalletAssets(client, async (id, _symbol, api) =>
    normalizeLocation(await api.query[pallet][storage].getValue(id))
  )
}
