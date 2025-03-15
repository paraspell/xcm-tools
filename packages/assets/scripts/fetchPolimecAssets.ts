/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src/types'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'
import { TMultiLocation } from '@paraspell/sdk-common'

export const fetchPolimecForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  return Promise.all(
    res.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        const multiLocation = capitalizeMultiLocation(era.toJSON()) as TMultiLocation

        const resDetail = await api.query[module].asset(era)

        return {
          symbol,
          decimals: +decimals,
          multiLocation,
          existentialDeposit: (resDetail.toHuman() as any)?.minBalance
        }
      }
    )
  )
}
