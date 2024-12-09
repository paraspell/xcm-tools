import { ApiPromise, WsProvider } from '@polkadot/api'
import type {
  THexString,
  TAsset,
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TSerializedApiCall,
  TNodePolkadotKusama
} from '../types'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from '../pjs/types'
import type { AccountData, AccountInfo } from '@polkadot/types/interfaces'
import type { StorageKey } from '@polkadot/types'
import { u32, type UInt } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import type { TBalanceResponse } from '../types/TBalance'
import { createApiInstanceForNode, getNode } from '../utils'
import { isForeignAsset } from '../utils/assets'

const lowercaseFirstLetter = (value: string) => value.charAt(0).toLowerCase() + value.slice(1)

const snakeToCamel = (str: string) =>
  str
    .toLowerCase()
    .replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''))

class PolkadotJsApi implements IPolkadotApi<TPjsApi, Extrinsic> {
  private _api?: TPjsApiOrUrl
  private api: TPjsApi
  private initialized = false
  private disconnectAllowed = true

  setApi(api?: TPjsApiOrUrl): void {
    this._api = api
  }

  getApiOrUrl(): TPjsApiOrUrl | undefined {
    return this._api
  }

  getApi(): TPjsApi {
    return this.api
  }

  async init(node: TNodeDotKsmWithRelayChains): Promise<void> {
    if (this.initialized) {
      return
    }

    if (typeof this._api === 'string') {
      this.api = await this.createApiInstance(this._api)
    } else {
      this.api = this._api ?? (await createApiInstanceForNode<TPjsApi, Extrinsic>(this, node))
    }

    this.initialized = true
  }

  async createApiInstance(wsUrl: string): Promise<TPjsApi> {
    const wsProvider = new WsProvider(wsUrl)
    return ApiPromise.create({ provider: wsProvider })
  }

  createAccountId(address: string): THexString {
    return this.api.createType('AccountId32', address).toHex()
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCall): Extrinsic {
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

  async getBalanceForeignPolkadotXcm(address: string, id?: string): Promise<bigint> {
    const parsedId = new u32(this.api.registry, id)
    const response: Codec = await this.api.query.assets.account(parsedId, address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.balance ? BigInt(obj.balance) : BigInt(0)
  }

  async getMythosForeignBalance(address: string): Promise<bigint> {
    const response: Codec = await this.api.query.balances.account(address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.free ? BigInt(obj.free) : BigInt(0)
  }

  async getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation): Promise<bigint> {
    const response: Codec = await this.api.query.foreignAssets.account(multiLocation, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getForeignAssetsByIdBalance(address: string, assetId: string): Promise<bigint> {
    const response: Codec = await this.api.query.foreignAssets.account(assetId, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getBalanceForeignBifrost(address: string, asset: TAsset): Promise<bigint> {
    const currencySelection = getNode('BifrostPolkadot').getCurrencySelection(asset)

    const response: Codec = await this.api.query.tokens.accounts(address, currencySelection)

    const accountData = response ? (response as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceNativeAcala(address: string, symbol: string): Promise<bigint> {
    const response: Codec = await this.api.query.tokens.accounts(address, {
      Token: symbol
    })

    const accountData = response ? (response as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceForeignXTokens(
    node: TNodePolkadotKusama,
    address: string,
    asset: TAsset
  ): Promise<bigint> {
    let pallet = 'tokens'

    if (node === 'Centrifuge' || node === 'Altair') {
      pallet = 'ormlTokens'
    }

    const response: Array<[StorageKey<AnyTuple>, Codec]> =
      await this.api.query[pallet].accounts.entries(address)

    const entry = response.find(
      ([
        {
          args: [_, assetItem]
        },
        _value1
      ]) => {
        const assetSymbol = assetItem.toString().toLowerCase()
        return (
          assetSymbol === asset.symbol?.toLowerCase() ||
          (isForeignAsset(asset) && assetSymbol === asset.assetId?.toLowerCase()) ||
          Object.values(assetItem.toHuman() ?? {})
            .toString()
            .toLowerCase() === asset.symbol?.toLowerCase() ||
          (isForeignAsset(asset) &&
            Object.values(assetItem.toHuman() ?? {})
              .toString()
              .toLowerCase() === asset.assetId?.toLowerCase())
        )
      }
    )

    const accountData = entry ? (entry[1] as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceForeignAssetsAccount(address: string, assetId: bigint | number): Promise<bigint> {
    const response = await this.api.query.assets.account(assetId, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getFromStorage(key: string): Promise<string> {
    const response = (await this.api.rpc.state.getStorage(key)) as Codec
    return response.toHex()
  }

  clone(): IPolkadotApi<TPjsApi, Extrinsic> {
    return new PolkadotJsApi()
  }

  async createApiForNode(
    node: TNodeDotKsmWithRelayChains
  ): Promise<IPolkadotApi<TPjsApi, Extrinsic>> {
    const api = new PolkadotJsApi()
    await api.init(node)
    return api
  }

  setDisconnectAllowed(allowed: boolean): void {
    this.disconnectAllowed = allowed
  }

  getDisconnectAllowed(): boolean {
    return this.disconnectAllowed
  }

  async disconnect(): Promise<void> {
    if (!this.disconnectAllowed) return

    // Disconnect api only if it was created automatically
    if (typeof this._api === 'string' || this._api === undefined) {
      await this.api.disconnect()
    }
  }
}

export default PolkadotJsApi
