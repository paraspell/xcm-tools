import type { ApiPromise } from '@polkadot/api'
import type { HexString } from '@polkadot/util/types'

export const createAccountId = (api: ApiPromise, account: string): HexString =>
  api.createType('AccountId32', account).toHex()
