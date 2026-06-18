/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

export const fetchZeitgeistAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const nativeKey = chain === 'Jamton' ? 'Native' : 'NativeAssetId'
  const entries = await api.query.AssetRegistry.Metadata.getEntries()

  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type !== nativeKey)
    .map(({ keyArgs: [key], value }: any) => ({
      assetId: String(key.value),
      symbol: decodeSymbol(value.symbol),
      decimals: value.decimals,
      existentialDeposit: edString(value),
      location: normalizeLocation(value.location)
    }))
}

const jamtonLocationOverrides: Record<string, TLocation> = {
  jamTON: {
    parents: 1,
    interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 22222078 }] }
  },
  stDOT: {
    parents: 1,
    interior: {
      X3: [
        { Parachain: 2004 },
        { PalletInstance: 110 },
        { AccountKey20: { network: null, key: '0xbc7e02c4178a7df7d3e564323a5c359dc96c4db4' } }
      ]
    }
  }
}

export const fetchZeitgeistNativeAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const nativeKey = chain === 'Jamton' ? 'Native' : 'NativeAssetId'
  const entries = await api.query.AssetRegistry.Metadata.getEntries()
  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type === nativeKey)
    .map(({ keyArgs: [key], value }: any) => {
      const symbol = decodeSymbol(value.symbol)
      const location = normalizeLocation(value.location)
      return {
        assetId: String(key.value),
        symbol,
        decimals: value.decimals,
        existentialDeposit: edString(value),
        location: chain === 'Jamton' ? jamtonLocationOverrides[symbol] : location,
        isNative: true
      }
    })
}
