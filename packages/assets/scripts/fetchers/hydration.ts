/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getJunctionValue,
  hasJunction,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import { createChainClient } from '../../../sdk-common/scripts/scriptUtils'
import { getParaId, getRelayChainOf } from '../../../sdk-core/src'
import type { TAssetInfoNoLoc } from '../types'
import { decodeSymbol, normalizeLocation } from '../utils/codecUtils'
import { edString } from '../utils'

const ALLOWED_AH_ASSET_SYMBOLS = ['BILL']

const EXCLUDED_ASSET_IDS = ['1000099']

const hydrationLocationOverrides: Record<string, TLocation> = {
  '42': {
    parents: 2,
    interior: {
      X2: [
        { GlobalConsensus: { Ethereum: { chainId: 1 } } },
        { AccountKey20: { network: null, key: '0x1abaea1f7c830bd89acc67ec4af516284b1bc33c' } }
      ]
    }
  }
}

const resolveAhMetadata = async (location: TLocation, ahApi: any) => {
  const id = getJunctionValue(location, 'GeneralIndex')
  const md = await ahApi.query.Assets.Metadata.getValue(id)
  const symbol = decodeSymbol(md.symbol)
  return ALLOWED_AH_ASSET_SYMBOLS.includes(symbol) ? { symbol, decimals: md.decimals } : null
}

export const fetchHydrationAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const ahChain = `AssetHub${getRelayChainOf(chain)}` as TSubstrateChain
  const ahClient = createChainClient(ahChain)
  const ahApi = ahClient.getUnsafeApi()

  try {
    const entries = await api.query.AssetRegistry.Assets.getEntries()
    const assets = await Promise.all(
      entries.map(async ({ keyArgs: [id], value }: any) => {
        const assetId = String(id)
        const baseSymbol = decodeSymbol(value.symbol)
        const finalSymbol = chain === 'HydrationPaseo' && assetId === '5' ? 'PAS' : baseSymbol

        const locRaw = await api.query.AssetRegistry.AssetLocations.getValue(id)
        const location = normalizeLocation(locRaw)

        let symbol = finalSymbol ?? ''
        let decimals = value.decimals

        const isAhAsset =
          location &&
          hasJunction(location, 'GeneralIndex') &&
          getJunctionValue(location, 'Parachain') === getParaId(ahChain)

        if (isAhAsset) {
          const resolved = await resolveAhMetadata(location, ahApi)
          if (resolved) {
            symbol = resolved.symbol
            decimals = resolved.decimals
          }
        }

        return {
          assetId,
          symbol,
          decimals,
          existentialDeposit: edString(value),
          location:
            location ?? (chain === 'Hydration' ? hydrationLocationOverrides[assetId] : undefined)
        }
      })
    )

    return assets.filter(
      a =>
        a.decimals && a.decimals > 0 && a.assetId !== '0' && !EXCLUDED_ASSET_IDS.includes(a.assetId)
    )
  } finally {
    ahClient.destroy()
  }
}
