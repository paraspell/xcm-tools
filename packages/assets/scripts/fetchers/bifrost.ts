/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

const FOREIGN_TYPES = ['token', 'token2', 'vtoken2', 'vtoken', 'vstoken2']

// Bifrost's on-chain CurrencyIdToLocations entry for PEN (Token2(12)) is anomalous:
// it stores { parents: 0, X1: [{ PalletInstance: 10 }] } — Pendulum's local view of
// its own native token — in the local form Bifrost otherwise uses only for its own
// wrapped assets. Passing it through the parents:0 transform produces a
// self-referential location (Bifrost's own paraId 2030), which blocks every PEN
// route involving Bifrost. Pin PEN to its canonical location instead (Pendulum,
// para 2094 — matching the Pendulum, Hydration and AssetHubPolkadot sections of
// the registry).
const locationOverrides: Record<string, TLocation> = {
  PEN: {
    parents: 1,
    interior: { X2: [{ Parachain: 2094 }, { PalletInstance: 10 }] }
  }
}

export const fetchBifrostAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.CurrencyMetadatas.getEntries()

  const mapped = await Promise.all(
    entries
      .filter(({ keyArgs: [key] }: any) => FOREIGN_TYPES.includes(String(key?.type).toLowerCase()))
      .map(async ({ keyArgs: [key], value }: any) => {
        const loc = await api.query.AssetRegistry.CurrencyIdToLocations.getValue(key)
        const isInteger = typeof key.value === 'number' || typeof key.value === 'bigint'
        if (!isInteger && !loc) return null

        const symbol = decodeSymbol(value.symbol)
        return {
          ...(isInteger ? { assetId: String(key.value) } : {}),
          symbol,
          decimals: value.decimals,
          existentialDeposit: edString(value),
          location: locationOverrides[symbol] ?? normalizeLocation(loc)
        }
      })
  )

  return mapped.filter((a): a is NonNullable<typeof a> => a !== null)
}

export const fetchBifrostNativeAssets = async (
  client: PolkadotClient
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.CurrencyMetadatas.getEntries()
  return Promise.all(
    entries
      .filter(({ keyArgs: [key] }: any) => String(key?.type).toLowerCase() === 'native')
      .map(async ({ keyArgs: [key], value }: any) => {
        const loc = await api.query.AssetRegistry.CurrencyIdToLocations.getValue(key)
        return {
          symbol: decodeSymbol(value.symbol),
          decimals: value.decimals,
          existentialDeposit: edString(value),
          location: normalizeLocation(loc),
          isNative: true
        }
      })
  )
}
