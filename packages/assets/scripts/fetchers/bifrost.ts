/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

const FOREIGN_TYPES = ['token', 'token2', 'vtoken2', 'vtoken', 'vstoken2']

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

        return {
          ...(isInteger ? { assetId: String(key.value) } : {}),
          symbol: decodeSymbol(value.symbol),
          decimals: value.decimals,
          existentialDeposit: edString(value),
          location: normalizeLocation(loc)
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
