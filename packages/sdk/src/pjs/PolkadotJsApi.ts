import { ApiPromise, WsProvider } from '@polkadot/api'
import type {
  HexString,
  TCurrencyCore,
  TMultiLocation,
  TNodeWithRelayChains,
  TSerializedApiCallV2
} from '../types'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { Extrinsic } from '../pjs/types'
import type { AccountData, AccountInfo } from '@polkadot/types/interfaces'
import type { StorageKey } from '@polkadot/types'
import { u32, type UInt } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import type { TBalanceResponse } from '../types/TBalance'
import { createApiInstanceForNode } from '../utils'

const lowercaseFirstLetter = (value: string) => value.charAt(0).toLowerCase() + value.slice(1)

const snakeToCamel = (str: string) =>
  str
    .toLowerCase()
    .replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))

class PolkadotJsApi implements IPolkadotApi<ApiPromise, Extrinsic> {
  private _api?: ApiPromise
  private api: ApiPromise

  setApi(api?: ApiPromise): void {
    this._api = api
  }

  getApi(): ApiPromise {
    return this.api
  }

  async init(node: TNodeWithRelayChains): Promise<void> {
    this.api = this._api ?? (await createApiInstanceForNode<ApiPromise, Extrinsic>(this, node))
  }

  async createApiInstance(wsUrl: string): Promise<ApiPromise> {
    const wsProvider = new WsProvider(wsUrl)
    return ApiPromise.create({ provider: wsProvider })
  }

  createAccountId(address: string): HexString {
    return this.api.createType('AccountId32', address).toHex()
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCallV2): Extrinsic {
    const values = Object.values(parameters)
    const moduleLowerCase = lowercaseFirstLetter(module)
    const sectionCamelCase = snakeToCamel(section)

    if (module === 'Utility') {
      return this.api.tx[moduleLowerCase][sectionCamelCase](...(values[0] as Extrinsic[]))
    }

    return this.api.tx[moduleLowerCase][sectionCamelCase](...values)
  }

  async calculateTransactionFee(tx: Extrinsic, address: string): Promise<bigint> {
    const { partialFee } = await tx.paymentInfo(address)
    return partialFee.toBigInt()
  }

  async getBalanceNative(address: string): Promise<bigint> {
    const response = (await this.api.query.system.account(address)) as AccountInfo
    return (response.data.free as UInt).toBigInt()
  }

  async getBalanceForeign(address: string, id?: string): Promise<bigint | null> {
    const parsedId = new u32(this.api.registry, id)
    const response: Codec = await this.api.query.assets.account(parsedId, address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.balance ? BigInt(obj.balance) : null
  }

  async getMythosForeignBalance(address: string): Promise<bigint | null> {
    const response: Codec = await this.api.query.balances.account(address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.free ? BigInt(obj.free) : null
  }

  async getAssetHubForeignBalance(
    address: string,
    multiLocation: TMultiLocation
  ): Promise<bigint | null> {
    const response: Codec = await this.api.query.foreignAssets.account(multiLocation, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getBalanceForeignXTokens(
    address: string,
    symbolOrId: TCurrencyCore,
    symbol: string | undefined,
    id: string | undefined
  ): Promise<bigint | null> {
    const response: Array<[StorageKey<AnyTuple>, Codec]> =
      await this.api.query.tokens.accounts.entries(address)

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
          ('id' in symbolOrId &&
            Object.values(asset.toHuman() ?? {}).toString() === symbolOrId.id) ||
          Object.values(asset.toHuman() ?? {}).toString() === id ||
          Object.values(asset.toHuman() ?? {}).toString() === symbol
        )
      }
    )

    const accountData = entry ? (entry[1] as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : null
  }

  clone(): IPolkadotApi<ApiPromise, Extrinsic> {
    return new PolkadotJsApi()
  }
}

export default PolkadotJsApi
