import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, HexString, TSerializedApiCall } from '../types'
import type { IPolkadotApi } from './IPolkadotApi'

class PolkadotJsApi implements IPolkadotApi<ApiPromise, Extrinsic> {
  private api: ApiPromise

  init(api: ApiPromise): void {
    this.api = api
  }

  createAccountId(address: string): HexString {
    return this.api.createType('AccountId32', address).toHex()
  }

  call({ module, section, parameters }: TSerializedApiCall): Extrinsic {
    return this.api.tx[module][section](...parameters)
  }
}

export default PolkadotJsApi
