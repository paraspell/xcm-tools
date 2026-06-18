/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

export const fetchBasiliskAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.AssetMetadataMap.getEntries()

  const assets = await Promise.all(
    entries.map(async ({ keyArgs: [id], value }: any) => {
      const location = await api.query.AssetRegistry.AssetLocations.getValue(id)
      const details = await api.query.AssetRegistry.Assets.getValue(id)
      return {
        assetId: String(id),
        symbol: decodeSymbol(value.symbol),
        decimals: value.decimals,
        location: normalizeLocation(location),
        existentialDeposit: edString(details)
      }
    })
  )

  return assets.filter(a => a.decimals && a.decimals > 0 && a.assetId !== '0')
}
