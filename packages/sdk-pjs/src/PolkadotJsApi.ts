/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type {
  TAsset,
  TBalanceResponse,
  TBridgeStatus,
  TDryRunCallBaseOptions,
  TDryRunNodeResultInternal,
  TDryRunXcmBaseOptions,
  TModuleError,
  TMultiLocation,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
  TSerializedApiCall,
  TWeight
} from '@paraspell/sdk-core'
import { BatchMode, InvalidParameterError, NodeNotSupportedError } from '@paraspell/sdk-core'
import {
  computeFeeFromDryRunPjs,
  createApiInstanceForNode,
  getAssetsObject,
  getNode,
  type IPolkadotApi,
  isForeignAsset,
  resolveModuleError,
  type TNodeDotKsmWithRelayChains
} from '@paraspell/sdk-core'
import { ApiPromise, WsProvider } from '@polkadot/api'
import type { StorageKey } from '@polkadot/types'
import { u32, type UInt } from '@polkadot/types'
import type { AccountData, AccountInfo } from '@polkadot/types/interfaces'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import { hexToU8a, isHex, stringToU8a, u8aToHex } from '@polkadot/util'
import { blake2AsHex, decodeAddress } from '@polkadot/util-crypto'

import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'

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

  async init(node: TNodeDotKsmWithRelayChains, _clientTtlMs?: number) {
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

  accountToHex(address: string, isPrefixed = true) {
    if (isHex(address)) return address
    const uint8Array = decodeAddress(address)
    return u8aToHex(uint8Array, -1, isPrefixed)
  }

  accountToUint8a(address: string): Uint8Array {
    return decodeAddress(address)
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCall) {
    const values = Object.values(parameters)
    const moduleLowerCase = lowercaseFirstLetter(module)
    const sectionCamelCase = snakeToCamel(section)

    return this.api.tx[moduleLowerCase][sectionCamelCase](...values)
  }

  callBatchMethod(calls: Extrinsic[], mode: BatchMode) {
    const section = mode === BatchMode.BATCH_ALL ? 'batchAll' : 'batch'
    return this.api.tx.utility[section](calls)
  }

  objectToHex(obj: unknown, typeName: string) {
    return Promise.resolve(this.api.createType(typeName, obj).toHex())
  }

  hexToUint8a(hex: string) {
    return hexToU8a(hex)
  }

  stringToUint8a(str: string) {
    return stringToU8a(str)
  }

  async calculateTransactionFee(tx: Extrinsic, address: string) {
    const { partialFee } = await tx.paymentInfo(address)
    return partialFee.toBigInt()
  }

  async quoteAhPrice(
    fromMl: TMultiLocation,
    toMl: TMultiLocation,
    amountIn: bigint,
    includeFee = true
  ) {
    const quoted = await this.api.call.assetConversionApi.quotePriceExactTokensForTokens(
      fromMl,
      toMl,
      amountIn.toString(),
      includeFee
    )

    return quoted.toJSON() !== null ? BigInt(quoted.toString()) : undefined
  }

  async getBalanceNative(address: string) {
    const response = (await this.api.query.system.account(address)) as AccountInfo
    return (response.data.free as UInt).toBigInt()
  }

  async getBalanceForeignPolkadotXcm(address: string, id?: string) {
    const parsedId = new u32(this.api.registry, id)
    const response: Codec = await this.api.query.assets.account(parsedId, address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.balance ? BigInt(obj.balance) : 0n
  }

  async getMythosForeignBalance(address: string) {
    const response: Codec = await this.api.query.balances.account(address)
    const obj = response.toJSON() as TBalanceResponse
    return obj.free ? BigInt(obj.free) : 0n
  }

  async getBalanceForeignAssetsPallet(address: string, multiLocation: TMultiLocation) {
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
    return accountData ? BigInt(accountData.free.toString()) : 0n
  }

  async getBalanceNativeAcala(address: string, symbol: string) {
    const response: Codec = await this.api.query.tokens.accounts(address, {
      Token: symbol
    })

    const accountData = response ? (response as AccountData) : null
    return accountData ? BigInt(accountData.free.toString()) : 0n
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
    return accountData ? BigInt(accountData.free.toString()) : 0n
  }

  async getBalanceAssetsPallet(address: string, assetId: bigint | number) {
    const response = await this.api.query.assets.account(assetId, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  getMethod(tx: Extrinsic): string {
    return tx.method.toString()
  }

  async getFromRpc(module: string, method: string, key: string) {
    const rpcModule = (this.api.rpc as any)[module]
    if (!rpcModule || !rpcModule[method]) {
      throw new InvalidParameterError(`RPC method ${module}.${method} not available`)
    }
    const response = (await rpcModule[method](key)) as Codec
    return response.toHex()
  }

  blake2AsHex(data: Uint8Array) {
    return blake2AsHex(data)
  }

  clone() {
    return new PolkadotJsApi()
  }

  async createApiForNode(node: TNodeDotKsmWithRelayChains) {
    const api = new PolkadotJsApi()
    await api.init(node)
    return api
  }

  async getDryRunCall({
    tx,
    address,
    node
  }: TDryRunCallBaseOptions<Extrinsic>): Promise<TDryRunNodeResultInternal> {
    const supportsDryRunApi = getAssetsObject(node).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new NodeNotSupportedError(`DryRunApi is not available on node ${node}`)
    }

    const nodesRequiringVersionParam: TNodeWithRelayChains[] = [
      'BifrostPolkadot',
      'BifrostKusama',
      'AssetHubKusama',
      'AssetHubPolkadot',
      'Kusama',
      'Polkadot',
      'Polimec',
      'Astar'
    ]

    const needsVersionParam = nodesRequiringVersionParam.includes(node)

    const DEFAULT_XCM_VERSION = 3

    const response = await this.api.call.dryRunApi.dryRunCall(
      {
        system: {
          Signed: address
        }
      },
      tx,
      ...(needsVersionParam ? [DEFAULT_XCM_VERSION] : [])
    )

    const result = response.toHuman() as any
    const resultJson = response.toJSON() as any

    const isSuccess = result.Ok && result.Ok.executionResult.Ok

    if (!isSuccess) {
      const moduleError = result.Ok.executionResult.Err.error.Module
      const failureReason = resolveModuleError(node, moduleError as TModuleError)
      return { success: false, failureReason }
    }

    const executionFee = await this.calculateTransactionFee(tx, address)
    const fee = computeFeeFromDryRunPjs(result, node, executionFee)

    const actualWeight = resultJson.ok.executionResult.ok.actualWeight

    const weight: TWeight | undefined = actualWeight
      ? {
          refTime: BigInt(actualWeight.refTime as string),
          proofSize: BigInt(actualWeight.proofSize as string)
        }
      : undefined

    const forwardedXcms =
      resultJson.ok.forwardedXcms.length > 0 ? resultJson.ok.forwardedXcms[0] : []

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : (i => (i.here === null ? 0 : (Array.isArray(i.x1) ? i.x1[0] : i.x1)?.parachain))(
            Object.values<any>(forwardedXcms[0])[0].interior
          )

    return { success: true, fee, weight, forwardedXcms, destParaId }
  }

  async getDryRunXcm({
    originLocation,
    xcm,
    node,
    origin
  }: TDryRunXcmBaseOptions): Promise<TDryRunNodeResultInternal> {
    const supportsDryRunApi = getAssetsObject(node).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new NodeNotSupportedError(`DryRunApi is not available on node ${node}`)
    }

    const response = await this.api.call.dryRunApi.dryRunXcm(originLocation, xcm)

    const result = response.toHuman() as any
    const resultJson = response.toJSON() as any

    const isSuccess = result.Ok && result.Ok.executionResult.Complete

    if (!isSuccess) {
      const failureReason = result.Ok.executionResult.Incomplete.error
      return { success: false, failureReason }
    }

    const emitted = result.Ok.emittedEvents

    // We want to look for the last event
    const reversedEvents = [...emitted].reverse()

    const palletsWithIssued = ['balances', 'foreignAssets', 'assets']

    const feeEvent =
      (origin === 'Mythos'
        ? reversedEvents.find(
            event => event.section === 'assetConversion' && event.method === 'SwapCreditExecuted'
          )
        : undefined) ??
      // Prefer an Issued event
      reversedEvents.find(
        (event: any) => palletsWithIssued.includes(event.section) && event.method === 'Issued'
      ) ??
      // Fallback to Minted event
      reversedEvents.find(
        event => ['balances', 'foreignAssets'].includes(event.section) && event.method === 'Minted'
      ) ??
      reversedEvents.find(
        event => ['currencies', 'tokens'].includes(event.section) && event.method === 'Deposited'
      )

    if (!feeEvent) {
      return Promise.resolve({
        success: false,
        failureReason: 'Cannot determine destination fee. No Issued event found'
      })
    }

    const feeAmount =
      feeEvent.section === 'assetConversion' ? feeEvent.data.amountIn : feeEvent.data.amount

    const fee = BigInt(feeAmount.replace(/,/g, ''))

    const actualWeight = resultJson.ok.executionResult.used

    const weight: TWeight | undefined = actualWeight
      ? {
          refTime: BigInt(actualWeight.refTime as string),
          proofSize: BigInt(actualWeight.proofSize as string)
        }
      : undefined

    const forwardedXcms =
      resultJson.ok.forwardedXcms.length > 0 ? resultJson.ok.forwardedXcms[0] : []

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : (i => (i.Here ? 0 : (Array.isArray(i.x1) ? i.x1[0] : i.x1)?.parachain))(
            Object.values<any>(forwardedXcms[0])[0].interior
          )

    return { success: true, fee, weight, forwardedXcms, destParaId }
  }

  async getBridgeStatus() {
    const outboundOperatingMode = await this.api.query.ethereumOutboundQueue.operatingMode()
    return outboundOperatingMode.toPrimitive() as TBridgeStatus
  }

  setDisconnectAllowed(allowed: boolean) {
    this.disconnectAllowed = allowed
  }

  getDisconnectAllowed() {
    return this.disconnectAllowed
  }

  async disconnect(force = false) {
    if (!this.initialized) return Promise.resolve()
    if (!force && !this.disconnectAllowed) return

    // Disconnect api only if it was created automatically
    if (force || typeof this._api === 'string' || this._api === undefined) {
      await this.api.disconnect()
    }
  }
}

export default PolkadotJsApi
