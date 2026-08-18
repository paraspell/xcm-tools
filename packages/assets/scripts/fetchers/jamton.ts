/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

export const fetchJamtonAssets = async (
  client: PolkadotClient,
  _chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.Metadata.getEntries()

  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type !== 'Native')
    .map(({ keyArgs: [key], value }: any) => ({
      assetId: String(key.value),
      symbol: decodeSymbol(value.symbol),
      decimals: value.decimals,
      existentialDeposit: edString(value),
      location: normalizeLocation(value.location)
    }))
    .filter(asset => asset.location !== undefined)
}

export const fetchJamtonNativeAssets = async (
  client: PolkadotClient,
  _chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.Metadata.getEntries()
  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type === 'Native')
    .map(({ keyArgs: [key], value }: any) => ({
      assetId: String(key.value),
      symbol: decodeSymbol(value.symbol),
      decimals: value.decimals,
      existentialDeposit: edString(value),
      location: normalizeLocation(value.location),
      isNative: true
    }))
    .filter(asset => asset.location !== undefined)
}
