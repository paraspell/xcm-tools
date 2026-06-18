/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

export const fetchInterlayAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.Metadata.getEntries()

  return entries.map(({ keyArgs: [id], value }: any) => ({
    assetId: String(id),
    symbol: decodeSymbol(value.symbol),
    decimals: value.decimals,
    location: normalizeLocation(value.location),
    existentialDeposit: edString(value)
  }))
}

const INTERLAY_NATIVE_JUNCTIONS: Record<string, TLocation> = {
  IBTC: {
    parents: 1,
    interior: {
      X2: [{ Parachain: 2032 }, { GeneralKey: { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' } }]
    }
  },
  KINT: {
    parents: 1,
    interior: {
      X2: [{ Parachain: 2092 }, { GeneralKey: { length: 2, data: '0x000c000000000000000000000000000000000000000000000000000000000000' } }]
    }
  },
  KBTC: {
    parents: 1,
    interior: {
      X2: [{ Parachain: 2092 }, { GeneralKey: { length: 2, data: '0x000b000000000000000000000000000000000000000000000000000000000000' } }]
    }
  },
  KSM: { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } }
}

const KINTSUGI_NATIVE_JUNCTIONS: Record<string, TLocation> = {
  KBTC: {
    parents: 1,
    interior: {
      X2: [{ Parachain: 2092 }, { GeneralKey: { length: 2, data: '0x000b000000000000000000000000000000000000000000000000000000000000' } }]
    }
  }
}

export const fetchInterlayNativeAssets = (natives: TAssetInfoNoLoc[]): TAssetInfoNoLoc[] =>
  natives.map(asset => ({ ...asset, location: INTERLAY_NATIVE_JUNCTIONS[asset.symbol] }))

export const fetchKintsugiNativeAssets = (natives: TAssetInfoNoLoc[]): TAssetInfoNoLoc[] =>
  natives.map(asset => ({ ...asset, location: KINTSUGI_NATIVE_JUNCTIONS[asset.symbol] }))
