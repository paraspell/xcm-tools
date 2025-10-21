/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src/types'
import { capitalizeLocation } from './utils'
import { TLocation } from '@paraspell/sdk-common'

export const fetchPolimecForeignAssets = async (
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
        const location = capitalizeLocation(era.toJSON()) as TLocation

        const details = await api.query[module].asset(era)
        const detailsHuman = details.toHuman() as any

        if (detailsHuman.status !== 'Live') return null

        return {
          symbol,
          decimals: +decimals,
          location,
          existentialDeposit: detailsHuman.minBalance
        }
      }
    )
  )

  return assets.filter(item => item !== null)
}
