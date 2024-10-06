import type { ApiPromise } from '@polkadot/api'
import type { HexString } from '@polkadot/util/types'

export const createAccID = (api: ApiPromise, account: string): HexString => {
  console.log('Generating AccountId32 address')
  return api.createType('AccountId32', account).toHex()
}
