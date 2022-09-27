/* eslint-disable */
import type { ApiPromise } from '@polkadot/api'

export function createAccID(api: ApiPromise, account: string): any{
    return api.createType("AccountId32", account).toHex()
}

export function selectLimit(limit: number, isLimited: boolean): any{
    if(isLimited){
        return {
            Limited: limit
        }
    }
    else {
        return "Unlimited"
    }
}