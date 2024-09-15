import { StorageKey } from '@polkadot/types'
import { TCurrencyCore } from '../../../types'
import { AnyTuple, Codec } from '@polkadot/types/types'
import { ApiPromise } from '@polkadot/api'
import { AccountData } from '@polkadot/types/interfaces'

export const getBalanceForeignXTokens = async (
  address: string,
  symbolOrId: TCurrencyCore,
  symbol: string | undefined,
  id: string | undefined,
  api: ApiPromise
): Promise<bigint | null> => {
  const response: Array<[StorageKey<AnyTuple>, Codec]> =
    await api.query.tokens.accounts.entries(address)

  const entry = response.find(
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

  const accountData = entry ? (entry[1] as AccountData) : null
  return accountData ? BigInt(accountData.free.toString()) : null
}
