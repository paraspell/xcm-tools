/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import { getParaId } from '../../../sdk-core/src'
import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

export const fetchAcalaAssets = async (client: PolkadotClient): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.AssetMetadatas.getEntries()

  return Promise.all(
    entries
      .filter(({ keyArgs: [key] }: any) => key?.type === 'ForeignAssetId')
      .map(async ({ keyArgs: [key], value }: any) => {
        const loc = await api.query.AssetRegistry.ForeignAssetLocations.getValue(key.value)
        return {
          assetId: String(key.value),
          symbol: decodeSymbol(value.symbol),
          decimals: value.decimals,
          location: normalizeLocation(loc),
          existentialDeposit: edString(value)
        }
      })
  )
}

const ACALA_GENERAL_KEYS = new Map<string, { length: number; data: string; paraId?: number }>([
  ['ACA', { length: 2, data: '0x0000000000000000000000000000000000000000000000000000000000000000' }],
  ['aSEED', { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' }],
  ['LcDOT', { length: 5, data: '0x040d000000000000000000000000000000000000000000000000000000000000' }],
  ['LDOT', { length: 2, data: '0x0003000000000000000000000000000000000000000000000000000000000000' }]
])

const KARURA_GENERAL_KEYS = new Map<string, { length: number; data: string; paraId?: number }>([
  ['KAR', { length: 2, data: '0x0080000000000000000000000000000000000000000000000000000000000000', paraId: 2000 }],
  ['LKSM', { length: 2, data: '0x0083000000000000000000000000000000000000000000000000000000000000', paraId: 2000 }],
  ['aSEED', { length: 2, data: '0x0081000000000000000000000000000000000000000000000000000000000000', paraId: 2000 }],
  ['KINT', { length: 2, data: '0x000c000000000000000000000000000000000000000000000000000000000000', paraId: 2092 }],
  ['KBTC', { length: 2, data: '0x000b000000000000000000000000000000000000000000000000000000000000', paraId: 2092 }],
  ['BNC', { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000', paraId: 2001 }],
  ['VSKSM', { length: 2, data: '0x0404000000000000000000000000000000000000000000000000000000000000' }]
])

const constructAcalaNativeLocation = (
  chain: TSubstrateChain,
  symbol: string
): TLocation | undefined => {
  const info = (chain === 'Acala' ? ACALA_GENERAL_KEYS : KARURA_GENERAL_KEYS).get(symbol)
  if (!info) return undefined
  return {
    parents: 1,
    interior: {
      X2: [
        { Parachain: info.paraId ?? getParaId(chain) },
        { GeneralKey: { length: info.length, data: info.data } }
      ]
    }
  }
}

export const fetchAcalaNativeAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.AssetRegistry.AssetMetadatas.getEntries()
  return entries
    .filter(({ keyArgs: [key] }: any) => key?.type === 'NativeAssetId')
    .map(({ value }: any) => {
      const symbol = decodeSymbol(value.symbol)
      return {
        symbol,
        decimals: value.decimals,
        existentialDeposit: edString(value),
        location: constructAcalaNativeLocation(chain, symbol),
        isNative: true
      }
    })
}
