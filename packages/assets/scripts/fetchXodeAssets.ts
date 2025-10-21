/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
import { TLocation } from '@paraspell/sdk-common'

const locationMap: Record<string, TLocation> = {
  DOT: {
    parents: 1,
    interior: { Here: null }
  },
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

export const fetchXodeOtherAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
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

        const location = locationMap[symbol.toUpperCase()]

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          existentialDeposit,
          location: location !== undefined ? capitalizeLocation(location) : undefined
        }
      }
    )
  )

  return assets
    .filter(asset => asset !== null)
    .filter(asset => asset.symbol.toUpperCase() !== 'GEM')
}
