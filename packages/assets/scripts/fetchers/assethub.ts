/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import { CHAINS, getParaId, Parents } from '../../../sdk-core/src'
import { getAllAssetsSymbols } from '../../src'
import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString, isLive } from '../utils'

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

  const foreign = await api.query.ForeignAssets.Metadata.getEntries()
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
