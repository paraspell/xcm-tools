/* eslint-disable */
import type { ApiPromise } from '@polkadot/api'

export function createAccID(api: ApiPromise, account: string): any{
    return api.createType("AccountId32", account).toHex()
}
