/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

export const fetchPendulumAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.Metadata.getEntries()

  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type === 'XCM')
    .map(({ keyArgs: [key], value }: any) => ({
      assetId: String(key.value),
      symbol: decodeSymbol(value.symbol),
      decimals: value.decimals,
      location: normalizeLocation(value.location),
      existentialDeposit: edString(value)
    }))
}
