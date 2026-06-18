/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

const locationOverrides: Record<string, TLocation> = {
  USD: {
    parents: 1,
    interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
  }
}

export const fetchCentrifugeAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.OrmlAssetRegistry.Metadata.getEntries()

  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type !== 'Native')
    .map(({ keyArgs: [key], value }: any) => {
      const symbol = decodeSymbol(value.symbol)
      return {
        assetId: key.type === 'Tranche' ? String(key.value[0]) : String(key.value),
        symbol,
        decimals: value.decimals,
        location: normalizeLocation(value.location) ?? locationOverrides[symbol],
        existentialDeposit: edString(value)
      }
    })
}

export const fetchCentrifugeNativeAssets = async (
  client: PolkadotClient
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.OrmlAssetRegistry.Metadata.getEntries()
  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type === 'Native')
    .map(({ value }: any) => ({
      symbol: decodeSymbol(value.symbol),
      decimals: value.decimals,
      existentialDeposit: edString(value),
      location: normalizeLocation(value.location),
      isNative: true
    }))
}
