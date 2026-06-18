/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { normalizeLocation } from '../utils/codecUtils'
import { fetchAssetsPalletAssets } from '../utils'

export const fetchDarwiniaAssets = (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> =>
  fetchAssetsPalletAssets(client, async (id, _symbol, api) => {
    const loc: any = await api.query.AssetManager.AssetIdType.getValue(id)
    return normalizeLocation(loc?.type === 'Xcm' ? loc.value : undefined)
  })
