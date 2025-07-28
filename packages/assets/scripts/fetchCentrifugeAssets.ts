/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { ApiPromise } from '@polkadot/api'
import { capitalizeLocation } from './utils'

export const fetchCentrifugeAssets = async (api: ApiPromise, query: string) => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()
  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => era.toHuman() !== 'Native'
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
        const eraObj = era as any

        const locationJson = value.toJSON() as any

        const location =
          locationJson.location !== null
            ? capitalizeLocation(locationJson.location.v3 ?? locationJson.location.v4)
            : undefined

        return {
          assetId:
            eraObj.type === 'Tranche'
              ? Object.values(era.toHuman() ?? {})[0][0].replaceAll(',', '')
              : Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          location,
          existentialDeposit: existentialDeposit
        }
      }
    )
}
