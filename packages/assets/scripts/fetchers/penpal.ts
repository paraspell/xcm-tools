/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString, isLive } from '../utils'

export const fetchPenpalAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.ForeignAssets.Metadata.getEntries()

  const assets = await Promise.all(
    entries.map(async ({ keyArgs: [loc], value }: any) => {
      const details = await api.query.ForeignAssets.Asset.getValue(loc)
      if (!isLive(details)) return null

      return {
        symbol: decodeSymbol(value.symbol),
        decimals: value.decimals,
        location: normalizeLocation(loc),
        existentialDeposit: edString(details)
      }
    })
  )

  return assets.filter((a): a is NonNullable<typeof a> => a !== null)
}
