/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiPromise, WsProvider } from '@polkadot/api'
import type {
  TAsset,
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TSerializedApiCall,
  TNodePolkadotKusama,
  TDryRunBaseOptions,
  TDryRunResult,
  TModuleError
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
import { computeFeeFromDryRunPjs } from '../utils/dryRun/computeFeeFromDryRunPjs'
import { resolveModuleError } from '../utils/dryRun/resolveModuleError'
import { getAssetsObject } from '../pallets/assets'
import { decodeAddress } from '@polkadot/util-crypto'
import { u8aToHex } from '@polkadot/util'

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

  setApi(api?: TPjsApiOrUrl) {
    this._api = api
  }

  getApiOrUrl() {
    return this._api
  }

  getApi() {
    return this.api
  }

  async init(node: TNodeDotKsmWithRelayChains) {
    if (this.initialized) {
      return
    }

    if (typeof this._api === 'string' || this._api instanceof Array) {
      this.api = await this.createApiInstance(this._api)
    } else {
      this.api = this._api ?? (await createApiInstanceForNode<TPjsApi, Extrinsic>(this, node))
    }

    this.initialized = true
  }

  async createApiInstance(wsUrl: string | string[]) {
    const wsProvider = new WsProvider(wsUrl)
    return ApiPromise.create({ provider: wsProvider })
  }

  createAccountId(address: string) {
    return this.api.createType('AccountId32', address).toHex()
  }

  accountToHex(address: string, isPrefixed = true) {
    const uint8Array = decodeAddress(address)
    return u8aToHex(uint8Array, -1, isPrefixed)
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCall) {
    const values = Object.values(parameters)
    const moduleLowerCase = lowercaseFirstLetter(module)
    const sectionCamelCase = snakeToCamel(section)

    if (module === 'Utility') {
      return this.api.tx[moduleLowerCase][sectionCamelCase](...(values[0] as Extrinsic[]))
    }

    return this.api.tx[moduleLowerCase][sectionCamelCase](...values)
  }

  async calculateTransactionFee(tx: Extrinsic, address: string) {
    const { partialFee } = await tx.paymentInfo(address)
    return partialFee.toBigInt()
  }

  async getBalanceNative(address: string) {
    const response = (await this.api.query.system.account(address)) as AccountInfo
    return (response.data.free as UInt).toBigInt()
  }

  async getBalanceForeignPolkadotXcm(address: string, id?: string) {
    const parsedId = new u32(this.api.registry, id)
    const response: Codec = await this.api.query.assets.account(parsedId, address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.balance ? BigInt(obj.balance) : BigInt(0)
  }

  async getMythosForeignBalance(address: string) {
    const response: Codec = await this.api.query.balances.account(address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.free ? BigInt(obj.free) : BigInt(0)
  }

  async getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation) {
    const response: Codec = await this.api.query.foreignAssets.account(multiLocation, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getForeignAssetsByIdBalance(address: string, assetId: string) {
    const response: Codec = await this.api.query.foreignAssets.account(assetId, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getBalanceForeignBifrost(address: string, asset: TAsset) {
    const currencySelection = getNode('BifrostPolkadot').getCurrencySelection(asset)

    const response: Codec = await this.api.query.tokens.accounts(address, currencySelection)

    const accountData = response ? (response as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceNativeAcala(address: string, symbol: string) {
    const response: Codec = await this.api.query.tokens.accounts(address, {
      Token: symbol
    })

    const accountData = response ? (response as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceForeignXTokens(node: TNodePolkadotKusama, address: string, asset: TAsset) {
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

  async getBalanceForeignAssetsAccount(address: string, assetId: bigint | number) {
    const response = await this.api.query.assets.account(assetId, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getFromStorage(key: string) {
    const response = (await this.api.rpc.state.getStorage(key)) as Codec
    return response.toHex()
  }

  clone() {
    return new PolkadotJsApi()
  }

  async createApiForNode(node: TNodeDotKsmWithRelayChains) {
    const api = new PolkadotJsApi()
    await api.init(node)
    return api
  }

  async getDryRun({ tx, address, node }: TDryRunBaseOptions<Extrinsic>): Promise<TDryRunResult> {
    const supportsDryRunApi = getAssetsObject(node).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new Error(`DryRunApi is not available on node ${node}`)
    }

    const result = (
      await this.api.call.dryRunApi.dryRunCall(
        {
          system: {
            Signed: address
          }
        },
        tx
      )
    ).toHuman() as any

    const isSuccess = result.Ok && result.Ok.executionResult.Ok

    if (!isSuccess) {
      const moduleError = result.Ok.executionResult.Err.error.Module
      const failureReason = resolveModuleError(node, moduleError as TModuleError)
      return { success: false, failureReason }
    }

    const executionFee = await this.calculateTransactionFee(tx, address)
    const fee = computeFeeFromDryRunPjs(result, node, executionFee)
    return { success: true, fee }
  }

  setDisconnectAllowed(allowed: boolean) {
    this.disconnectAllowed = allowed
  }

  getDisconnectAllowed() {
    return this.disconnectAllowed
  }

  async disconnect() {
    if (!this.disconnectAllowed) return

    // Disconnect api only if it was created automatically
    if (typeof this._api === 'string' || this._api === undefined) {
      await this.api.disconnect()
    }
  }
}

export default PolkadotJsApi
