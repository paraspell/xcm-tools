/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { StorageKey } from '@polkadot/types'
import { TCurrencyCore } from '../../../types'
import { AnyTuple, Codec } from '@polkadot/types/types'
import { ApiPromise } from '@polkadot/api'

export const getBalanceForeignXTokens = async (
  address: string,
  symbolOrId: TCurrencyCore,
  symbol: string | undefined,
  id: string | undefined,
  api: ApiPromise
): Promise<bigint | null> => {
  const response: Array<[StorageKey<AnyTuple>, Codec]> =
    await api.query.tokens.accounts.entries(address)

  const entry: any = response.find(
    ([
      {
        args: [_, asset]
      },
      _value1
    ]) => {
      return (
        ('symbol' in symbolOrId && asset.toString() === symbolOrId.symbol) ||
        ('id' in symbolOrId && asset.toString() === symbolOrId.id) ||
        asset.toString() === id ||
        asset.toString() === symbol ||
        ('symbol' in symbolOrId &&
          Object.values(asset.toHuman() ?? {}).toString() === symbolOrId.symbol) ||
        ('id' in symbolOrId && Object.values(asset.toHuman() ?? {}).toString() === symbolOrId.id) ||
        Object.values(asset.toHuman() ?? {}).toString() === id ||
        Object.values(asset.toHuman() ?? {}).toString() === symbol
      )
    }
  )
  return entry ? BigInt(entry[1].free.toString()) : null
}
