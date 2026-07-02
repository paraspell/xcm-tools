/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDynamicBuilder, getLookupFn } from '@polkadot-api/metadata-builders'
import { decAnyMetadata, unifyMetadata } from '@polkadot-api/substrate-bindings'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws'

import { CHAINS, getChainProviders, getParaId, Parents } from '../../../sdk-core/src'
import { getAllAssetsSymbols } from '../../src'
import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString, isLive } from '../utils'

// Westend Asset Hub has orphaned ForeignAssets keys left by the XCMv5 migration that
// can no longer be decoded (paritytech/polkadot-sdk#7989), so getEntries() throws. List
// the keys and decode them one by one, dropping the broken ones. Remove once fixed.
const getForeignMetadataEntries = async (chain: TSubstrateChain, client: PolkadotClient) => {
  const { hash } = await client.getFinalizedBlock()
  const builder = getDynamicBuilder(
    getLookupFn(unifyMetadata(decAnyMetadata(await client.getMetadata(hash))))
  )
  const storage = builder.buildStorage('ForeignAssets', 'Metadata')
  const prefix = storage.keys.enc()

  const provider = getWsProvider(getChainProviders(chain))
  const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>()
  let id = 0
  const conn = provider((message: any) => {
    const p = pending.get(message.id)
    if (!p) return
    pending.delete(message.id)
    message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result)
  })
  const call = (method: string, params: any[]): Promise<any> =>
    new Promise((resolve, reject) => {
      const reqId = ++id
      pending.set(reqId, { resolve, reject })
      conn.send({ jsonrpc: '2.0', id: reqId, method, params })
    })

  const keys: string[] = []
  try {
    let startKey: string | null = null
    for (;;) {
      const page: string[] = await call('state_getKeysPaged', [prefix, 500, startKey, hash])
      keys.push(...page)
      if (page.length < 500) break
      startKey = page[page.length - 1]
    }
  } finally {
    conn.disconnect()
  }

  const entries: { keyArgs: any[]; value: any }[] = []
  for (const key of keys) {
    let keyArgs: any[]
    try {
      keyArgs = storage.keys.dec(key)
    } catch {
      continue
    }
    const raw = await client.rawQuery(key, { at: hash })
    if (raw === null) continue
    entries.push({ keyArgs, value: storage.value.dec(raw) })
  }
  return entries
}

export const fetchAssetHubAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()

  const allSymbols = new Set<string>()
  CHAINS.filter(c => !c.includes('AssetHub')).forEach(c =>
    getAllAssetsSymbols(c).forEach(s => allSymbols.add(s.toLowerCase()))
  )

  const regular = await api.query.Assets.Metadata.getEntries()
  const parsedRegular = (
    await Promise.all(
      regular
        .filter(({ value }: any) => allSymbols.has(decodeSymbol(value.symbol).toLowerCase()))
        .map(async ({ keyArgs: [id], value }: any) => {
          const details = await api.query.Assets.Asset.getValue(id)
          if (!isLive(details)) return null

          return {
            assetId: String(id),
            symbol: decodeSymbol(value.symbol),
            decimals: value.decimals,
            location: {
              parents: 1,
              interior: {
                X3: [
                  { Parachain: getParaId('AssetHubPolkadot') },
                  { PalletInstance: 50 },
                  { GeneralIndex: Number(id) }
                ]
              }
            },
            existentialDeposit: edString(details)
          }
        })
    )
  ).filter((a): a is NonNullable<typeof a> => a !== null)

  const foreign =
    chain === 'AssetHubWestend'
      ? await getForeignMetadataEntries(chain, client)
      : await api.query.ForeignAssets.Metadata.getEntries()
  const parsedForeign = await Promise.all(
    foreign.map(async ({ keyArgs: [loc], value }: any) => {
      const details = await api.query.ForeignAssets.Asset.getValue(loc)
      return {
        symbol: decodeSymbol(value.symbol),
        decimals: value.decimals,
        location: normalizeLocation(loc),
        existentialDeposit: edString(details)
      }
    })
  )

  const wantedSymbol = chain === 'AssetHubPolkadot' ? 'KSM' : 'DOT'
  const filteredRegular = parsedRegular.filter(
    a => !(a.symbol === wantedSymbol && a.location.parents !== Parents.TWO)
  )

  return [...filteredRegular, ...parsedForeign]
}
