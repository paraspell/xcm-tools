/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type {
  TAssetInfo,
  TBalanceResponse,
  TBridgeStatus,
  TBuilderOptions,
  TChain,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunXcmBaseOptions,
  TLocation,
  TModuleError,
  TPallet,
  TSerializedApiCall,
  TSubstrateChain,
  TWeight
} from '@paraspell/sdk-core'
import {
  addXcmVersionHeader,
  assertHasLocation,
  BatchMode,
  ChainNotSupportedError,
  createChainClient,
  findNativeAssetInfoOrThrow,
  getChain,
  InvalidParameterError,
  isConfig,
  isRelayChain,
  localizeLocation,
  Version
} from '@paraspell/sdk-core'
import {
  computeFeeFromDryRunPjs,
  getAssetsObject,
  type IPolkadotApi,
  isForeignAsset,
  MissingChainApiError,
  resolveModuleError
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
  private _config?: TBuilderOptions<TPjsApiOrUrl>
  private api: TPjsApi
  private initialized = false
  private disconnectAllowed = true
  private _chain: TSubstrateChain

  constructor(config?: TBuilderOptions<TPjsApiOrUrl>) {
    this._config = config
  }

  getConfig() {
    return this._config
  }

  getApi() {
    return this.api
  }

  async init(chain: TChain, _clientTtlMs?: number) {
    if (this.initialized || chain === 'Ethereum') {
      return
    }

    this._chain = chain

    const apiConfig = this.getApiConfigForChain(chain)

    if (isConfig(this._config) && this._config.development && !apiConfig) {
      throw new MissingChainApiError(chain)
    }

    this.api = await this.resolveApi(apiConfig, chain)
    this.initialized = true
  }

  private getApiConfigForChain(chain: TSubstrateChain): TPjsApiOrUrl | undefined {
    if (isConfig(this._config)) {
      return this._config.apiOverrides?.[chain]
    }
    return this._config
  }

  private async resolveApi(
    apiConfig: TPjsApiOrUrl | undefined,
    chain: TSubstrateChain
  ): Promise<TPjsApi> {
    if (!apiConfig) {
      return createChainClient<TPjsApi, Extrinsic>(this, chain)
    }

    if (typeof apiConfig === 'string' || apiConfig instanceof Array) {
      return this.createApiInstance(apiConfig)
    }

    return apiConfig
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

  callTxMethod({ module, method, parameters }: TSerializedApiCall) {
    const values = Object.values(parameters)
    const moduleLowerCase = lowercaseFirstLetter(module)
    const methodCamelCase = snakeToCamel(method)

    return this.api.tx[moduleLowerCase][methodCamelCase](...values)
  }

  callBatchMethod(calls: Extrinsic[], mode: BatchMode) {
    const method = mode === BatchMode.BATCH_ALL ? 'batchAll' : 'batch'
    return this.api.tx.utility[method](calls)
  }

  callDispatchAsMethod(call: Extrinsic, address: string): Extrinsic {
    return this.api.tx.utility.dispatchAs(address, call)
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

  async quoteAhPrice(fromMl: TLocation, toMl: TLocation, amountIn: bigint, includeFee = true) {
    const quoted = await this.api.call.assetConversionApi.quotePriceExactTokensForTokens(
      fromMl,
      toMl,
      amountIn.toString(),
      includeFee
    )

    return quoted.toJSON() !== null ? BigInt(quoted.toString()) : undefined
  }

  getEvmStorage(contract: string, slot: string): Promise<string> {
    return Promise.resolve(this.api.query.evm.accountStorages.key(contract, slot))
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

  async getBalanceForeignAssetsPallet(address: string, location: TLocation) {
    const response: Codec = await this.api.query.foreignAssets.account(location, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getForeignAssetsByIdBalance(address: string, assetId: string) {
    const response: Codec = await this.api.query.foreignAssets.account(assetId, address)
    const obj = response.toJSON() as TBalanceResponse
    return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
  }

  async getBalanceForeignBifrost(address: string, asset: TAssetInfo) {
    const currencySelection = getChain('BifrostPolkadot').getCurrencySelection(asset)

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

  async getBalanceForeignXTokens(chain: TSubstrateChain, address: string, asset: TAssetInfo) {
    let pallet = 'tokens'

    if (chain === 'Centrifuge' || chain === 'Altair') {
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

  hasMethod(pallet: TPallet, method: string): Promise<boolean> {
    const palletFormatted = lowercaseFirstLetter(pallet)
    const methodFormatted = snakeToCamel(method)
    return Promise.resolve(this.api.tx[palletFormatted]?.[methodFormatted] !== undefined)
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
    return new PolkadotJsApi(isConfig(this._config) ? this._config : undefined)
  }

  async createApiForChain(chain: TSubstrateChain) {
    const api = new PolkadotJsApi()
    await api.init(chain)
    return api
  }

  async getDryRunCall({
    tx,
    address,
    feeAsset,
    chain
  }: TDryRunCallBaseOptions<Extrinsic>): Promise<TDryRunChainResult> {
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new ChainNotSupportedError(`DryRunApi is not available on chain ${chain}`)
    }

    const DEFAULT_XCM_VERSION = 3

    const usedAsset = feeAsset ?? findNativeAssetInfoOrThrow(chain)
    const usedSymbol = usedAsset.symbol

    const performDryRunCall = async (includeVersion: boolean) => {
      return this.api.call.dryRunApi.dryRunCall(
        { system: { Signed: address } },
        tx,
        ...(includeVersion ? [DEFAULT_XCM_VERSION] : [])
      )
    }

    const getExecutionSuccessFromResult = (resultHuman: any): boolean => {
      return Boolean(resultHuman?.Ok && resultHuman.Ok.executionResult?.Ok)
    }

    const extractFailureReasonFromResult = (resultHuman: any, resultJson: any): string => {
      const modErrHuman = resultHuman?.Ok?.executionResult?.Err?.error?.Module
      if (modErrHuman) {
        return resolveModuleError(chain, modErrHuman as TModuleError)
      }
      const otherErrHuman = resultHuman?.Ok?.executionResult?.Err?.error?.Other
      if (otherErrHuman) {
        return String(otherErrHuman)
      }
      const execErrJson = resultJson?.ok?.executionResult?.err?.error
      if (execErrJson?.module) {
        return resolveModuleError(chain, execErrJson.module as TModuleError)
      }
      if (execErrJson?.other) {
        return String(execErrJson.other)
      }
      return JSON.stringify(resultJson ?? resultHuman ?? 'Unknown error')
    }

    // Attempt 1: WITHOUT version
    let response: any
    let resultHuman: any
    let resultJson: any
    let isSuccess = false
    let failureReason = ''
    let shouldRetryWithVersion = false

    try {
      response = await performDryRunCall(false)
      resultHuman = response.toHuman()
      resultJson = response.toJSON()
      isSuccess = getExecutionSuccessFromResult(resultHuman)

      if (!isSuccess) {
        failureReason = extractFailureReasonFromResult(resultHuman, resultJson)
        if (failureReason === 'VersionedConversionFailed') {
          shouldRetryWithVersion = true
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Expected 3 arguments')) {
        shouldRetryWithVersion = true
      } else {
        return { success: false, failureReason: msg, currency: usedSymbol, asset: usedAsset }
      }
    }

    // Attempt 2: WITH version (only if needed)
    if (shouldRetryWithVersion) {
      try {
        response = await performDryRunCall(true)
        resultHuman = response.toHuman()
        resultJson = response.toJSON()
        isSuccess = getExecutionSuccessFromResult(resultHuman)
        if (!isSuccess) {
          failureReason = extractFailureReasonFromResult(resultHuman, resultJson)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        failureReason = failureReason || msg
        return { success: false, failureReason, currency: usedSymbol, asset: usedAsset }
      }
    }

    if (!isSuccess) {
      return {
        success: false,
        failureReason: failureReason || 'Unknown error',
        currency: usedSymbol,
        asset: usedAsset
      }
    }

    const executionFee = await this.calculateTransactionFee(tx, address)
    const fee = computeFeeFromDryRunPjs(resultHuman, chain, executionFee)

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

    return {
      success: true,
      fee,
      currency: usedSymbol,
      asset: usedAsset,
      weight,
      forwardedXcms,
      destParaId
    }
  }

  async getXcmPaymentApiFee(chain: TSubstrateChain, xcm: any, asset: TAssetInfo): Promise<bigint> {
    const weight = await this.getXcmWeight(xcm)

    assertHasLocation(asset)

    const localizedLocation =
      chain === 'AssetHubPolkadot' || chain === 'AssetHubKusama' || isRelayChain(chain)
        ? localizeLocation(chain, asset.location)
        : asset.location

    const feeResult = await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight,
      addXcmVersionHeader(localizedLocation, Version.V4)
    )

    const res = feeResult.toJSON() as any

    return BigInt(res.ok)
  }

  async getXcmWeight(xcm: any): Promise<TWeight> {
    const result = await this.api.call.xcmPaymentApi.queryXcmWeight(xcm)
    const resultJson = result.toJSON() as any
    return resultJson.ok
  }

  async getDryRunXcm({
    originLocation,
    xcm,
    asset,
    chain,
    origin
  }: TDryRunXcmBaseOptions): Promise<TDryRunChainResult> {
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new ChainNotSupportedError(`DryRunApi is not available on chain ${chain}`)
    }

    const response = await this.api.call.dryRunApi.dryRunXcm(originLocation, xcm)

    const result = response.toHuman() as any
    const resultJson = response.toJSON() as any

    const symbol = asset.symbol

    const isSuccess = result.Ok && result.Ok.executionResult.Complete

    if (!isSuccess) {
      const failureReason = result.Ok.executionResult.Incomplete.error
      return { success: false, failureReason, currency: symbol, asset }
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
        failureReason: 'Cannot determine destination fee. No Issued event found',
        currency: symbol,
        asset
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

    return { success: true, fee, currency: symbol, asset, weight, forwardedXcms, destParaId }
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

    const api = isConfig(this._config) ? this._config.apiOverrides?.[this._chain] : this._config

    // Disconnect api only if it was created automatically
    if (force || typeof api === 'string' || api === undefined) {
      await this.api.disconnect()
    }
  }
}

export default PolkadotJsApi
