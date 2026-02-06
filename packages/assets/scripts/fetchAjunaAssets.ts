/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
import { TLocation, TSubstrateChain } from '@paraspell/sdk-common'

const ajunaPaseolocationOverrides: Record<string, TLocation> = {
  USDT: {
    parents: 1,
    interior: {
      X3: [
        {
          Parachain: 1000
        },
        {
          PalletInstance: 50
        },
        {
          GeneralIndex: 1984
        }
      ]
    }
  }
}

const locationPalletOverride: Partial<Record<TSubstrateChain, [string, string]>> = {
  Peaq: ['xcAssetConfig', 'assetIdToLocation']
}

const getLocationPalletInfo = (chain: TSubstrateChain) => {
  return locationPalletOverride[chain] ?? ['assetRegistry', 'assetIdLocation']
}

export const fetchAjunaOtherAssets = async (
  api: ApiPromise,
  chain: TSubstrateChain,
  query: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const response = await api.query[module][method].entries()

  const assets = await Promise.all(
    response.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const details = await api.query[module].asset(era)
        const detailsHuman = details.toHuman() as any

        if (detailsHuman.status !== 'Live') return null

        const existentialDeposit = detailsHuman.minBalance

        const [pallet, method] = getLocationPalletInfo(chain)

        const location = await api.query[pallet][method](era)

        const locationJson = location.toJSON() as any

        const resolvedLocation =
          location.toJSON() !== null
            ? capitalizeLocation(locationJson.v3 ?? locationJson)
            : undefined

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          existentialDeposit,
          location:
            chain === 'AjunaPaseo'
              ? (resolvedLocation ?? ajunaPaseolocationOverrides[symbol])
              : resolvedLocation
        }
      }
    )
  )

  return assets.filter(item => item !== null)
}
