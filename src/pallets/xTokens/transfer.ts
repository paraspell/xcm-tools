import type { ApiPromise } from '@polkadot/api'

export function transfer(api: ApiPromise, currency: string, amount: any, to: string) {
  return api.tx.xTokens
    .transfer(
      {
        Token: currency
      },
      amount,
      {
        V1: {
          parents: 1,
          interior: {
            X1: {
              AccountId32: {
                network: 'any',
                id: api
                  .createType('AccountId32', to)
                  .toHex()
              }
            }
          }
        }
      },
      4600000000
    )
}
