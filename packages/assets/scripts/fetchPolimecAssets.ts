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
  const res = await api.query[module][method].entries()

  return Promise.all(
    res.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        const location = capitalizeLocation(era.toJSON()) as TLocation

        const resDetail = await api.query[module].asset(era)

        return {
          symbol,
          decimals: +decimals,
          location,
          existentialDeposit: (resDetail.toHuman() as any)?.minBalance
        }
      }
    )
  )
}
