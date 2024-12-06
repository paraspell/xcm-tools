/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../../src/types'

export const fetchPendulumForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => {
        return Object.prototype.hasOwnProperty.call(era.toHuman(), 'XCM')
      }
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
        return {
          assetId: Object.values(era.toHuman() ?? {})[0],
          symbol,
          decimals: +decimals,
          existentialDeposit: existentialDeposit
        }
      }
    )
}
