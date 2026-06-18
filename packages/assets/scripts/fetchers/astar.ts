import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { normalizeLocation } from '../utils/codecUtils'
import { fetchAssetsPalletAssets } from '../utils'

export const fetchAstarAssets = (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> =>
  fetchAssetsPalletAssets(client, (id, _symbol, api) =>
    api.query.XcAssetConfig.AssetIdToLocation.getValue(id).then(normalizeLocation)
  )
