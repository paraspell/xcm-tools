/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type {
  TAssetInfo,
  TBridgeStatus,
  TBuilderOptions,
  TChain,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunError,
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
  assertHasId,
  assertHasLocation,
  BatchMode,
  ChainNotSupportedError,
  findNativeAssetInfoOrThrow,
  getChain,
  getChainProviders,
  hasXcmPaymentApiSupport,
  InvalidParameterError,
  isAssetXcEqual,
  isConfig,
  localizeLocation,
  Version,
  wrapTxBypass
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
import { blake2AsHex, decodeAddress, validateAddress } from '@polkadot/util-crypto'

import type { Extrinsic, TBalanceResponse, TPjsApi, TPjsApiOrUrl } from './types'

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
      const wsUrl = getChainProviders(chain)
      return this.createApiInstance(wsUrl, chain)
    }

    if (typeof apiConfig === 'string' || apiConfig instanceof Array) {
      return this.createApiInstance(apiConfig, chain)
    }

    return apiConfig
  }

  async createApiInstance(wsUrl: string | string[], _chain: TSubstrateChain) {
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
    const origin = { system: { Signed: address } }
    return this.api.tx.utility.dispatchAs(origin, call)
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

  async getBalanceForeignPolkadotXcm(_chain: TSubstrateChain, address: string, asset: TAssetInfo) {
    assertHasId(asset)
    const parsedId = new u32(this.api.registry, asset.assetId)
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

  getTypeThenAssetCount(tx: Extrinsic): number | undefined {
    if (this.getMethod(tx) !== 'transferAssetsUsingTypeAndThen') return undefined
    const human = tx.toHuman() as any
    return (Object.values(human.method.args.assets)[0] as any).length
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

  async getDryRunCall(options: TDryRunCallBaseOptions<Extrinsic>): Promise<TDryRunChainResult> {
    const {
      tx,
      address,
      feeAsset,
      chain,
      destination,
      useRootOrigin = false,
      bypassOptions
    } = options
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new ChainNotSupportedError(`DryRunApi is not available on chain ${chain}`)
    }

    const DEFAULT_XCM_VERSION = 3

    const basePayload = useRootOrigin ? { system: { Root: null } } : { system: { Signed: address } }

    const resolvedTx = useRootOrigin
      ? await wrapTxBypass(
          {
            ...options,
            api: this
          },
          bypassOptions
        )
      : tx

    const usedAsset = feeAsset ?? findNativeAssetInfoOrThrow(chain)
    const usedSymbol = usedAsset.symbol

    const performDryRunCall = async (includeVersion: boolean) => {
      return this.api.call.dryRunApi.dryRunCall(
        basePayload,
        resolvedTx,
        ...(includeVersion ? [DEFAULT_XCM_VERSION] : [])
      )
    }

    const getExecutionSuccessFromResult = (resultHuman: any): boolean => {
      return Boolean(resultHuman?.Ok && resultHuman.Ok.executionResult?.Ok)
    }

    const extractFailureReasonFromResult = (resultHuman: any, resultJson: any): TDryRunError => {
      const modErrHuman = resultHuman?.Ok?.executionResult?.Err?.error?.Module
      if (modErrHuman) {
        return resolveModuleError(chain, modErrHuman as TModuleError)
      }
      const otherErrHuman = resultHuman?.Ok?.executionResult?.Err?.error?.Other
      if (otherErrHuman) {
        return { failureReason: String(otherErrHuman) }
      }
      const execErrJson = resultJson?.ok?.executionResult?.err?.error
      if (execErrJson?.module) {
        return resolveModuleError(chain, execErrJson.module as TModuleError)
      }
      if (execErrJson?.other) {
        return { failureReason: String(execErrJson.other) }
      }
      return { failureReason: JSON.stringify(resultJson ?? resultHuman ?? 'Unknown error') }
    }

    // Attempt 1: WITHOUT version
    let response: any
    let resultHuman: any
    let resultJson: any
    let isSuccess = false
    let failureErr: TDryRunError = { failureReason: '' }
    let shouldRetryWithVersion = false

    try {
      response = await performDryRunCall(false)
      resultHuman = response.toHuman()
      resultJson = response.toJSON()
      isSuccess = getExecutionSuccessFromResult(resultHuman)

      if (!isSuccess) {
        failureErr = extractFailureReasonFromResult(resultHuman, resultJson)
        if (failureErr.failureReason === 'VersionedConversionFailed') {
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
          failureErr = extractFailureReasonFromResult(resultHuman, resultJson)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        failureErr = failureErr || msg
        return {
          success: false,
          failureReason: failureErr.failureReason,
          failureSubReason: failureErr.failureSubReason,
          currency: usedSymbol,
          asset: usedAsset
        }
      }
    }

    if (!isSuccess) {
      return {
        success: false,
        failureReason: failureErr.failureReason || 'Unknown error',
        failureSubReason: failureErr.failureSubReason,
        currency: usedSymbol,
        asset: usedAsset
      }
    }

    const forwardedXcms =
      resultJson.ok.forwardedXcms.length > 0 ? resultJson.ok.forwardedXcms[0] : []

    const actualWeight = resultJson.ok.executionResult.ok.actualWeight

    const weight: TWeight | undefined = actualWeight
      ? {
          refTime: BigInt(actualWeight.refTime as string),
          proofSize: BigInt(actualWeight.proofSize as string)
        }
      : undefined

    const nativeAsset = findNativeAssetInfoOrThrow(chain)

    const hasLocation = feeAsset ? Boolean(feeAsset.location) : Boolean(nativeAsset?.location)

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : (i => (i.here === null ? 0 : (Array.isArray(i.x1) ? i.x1[0] : i.x1)?.parachain))(
            Object.values<any>(forwardedXcms[0])[0].interior
          )

    if (
      hasXcmPaymentApiSupport(chain) &&
      resultJson.ok.local_xcm &&
      hasLocation &&
      (feeAsset || (chain.startsWith('AssetHub') && destination === 'Ethereum'))
    ) {
      const xcmFee = await this.getXcmPaymentApiFee(
        chain,
        resultJson.ok.local_xcm,
        forwardedXcms,
        feeAsset ?? nativeAsset
      )

      if (typeof xcmFee === 'bigint') {
        return Promise.resolve({
          success: true,
          fee: xcmFee,
          currency: usedSymbol,
          asset: usedAsset,
          weight,
          forwardedXcms,
          destParaId
        })
      }
    }

    const executionFee = await this.calculateTransactionFee(tx, address)
    const fee = computeFeeFromDryRunPjs(resultHuman, chain, executionFee)

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

  async getXcmPaymentApiFee(
    chain: TSubstrateChain,
    localXcm: any,
    forwardedXcm: any,
    asset: TAssetInfo
  ): Promise<bigint> {
    const weight = await this.getXcmWeight(localXcm)

    assertHasLocation(asset)

    const assetLocalizedLoc = localizeLocation(chain, asset.location)

    const feeResult = await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight,
      addXcmVersionHeader(assetLocalizedLoc, Version.V4)
    )

    const execFeeRes = feeResult.toJSON() as any
    const execFee = BigInt(execFeeRes.ok)

    const deliveryFeeRes =
      forwardedXcm.length > 0
        ? await this.api.call.xcmPaymentApi.queryDeliveryFees(forwardedXcm[0], forwardedXcm[1][0])
        : undefined

    const deliveryFeeResJson = deliveryFeeRes?.toJSON() as any

    const deliveryFeeResolved =
      deliveryFeeRes && (deliveryFeeResJson.ok?.v4 ?? deliveryFeeResJson.ok?.v3)?.length > 0
        ? BigInt((deliveryFeeResJson?.ok?.v4 ?? deliveryFeeResJson?.ok?.v3)?.[0]?.fun?.fungible)
        : 0n

    const nativeAsset = findNativeAssetInfoOrThrow(chain)

    let deliveryFee: bigint
    if (isAssetXcEqual(asset, nativeAsset)) {
      deliveryFee = deliveryFeeResolved
    } else {
      try {
        assertHasLocation(nativeAsset)

        const res = await this.quoteAhPrice(
          localizeLocation(chain, nativeAsset.location),
          assetLocalizedLoc,
          deliveryFeeResolved,
          false
        )

        deliveryFee = res ?? 0n
      } catch (_e) {
        deliveryFee = 0n
      }
    }

    return execFee + deliveryFee
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
  }: TDryRunXcmBaseOptions<Extrinsic>): Promise<TDryRunChainResult> {
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
      const error = result.Ok.executionResult.Incomplete.error
      const failureReason = typeof error === 'string' ? error : error.error
      return { success: false, failureReason, currency: symbol, asset }
    }

    const forwardedXcms =
      resultJson.ok.forwardedXcms.length > 0 ? resultJson.ok.forwardedXcms[0] : []

    const actualWeight = resultJson.ok.executionResult.used

    const weight: TWeight | undefined = actualWeight
      ? {
          refTime: BigInt(actualWeight.refTime as string),
          proofSize: BigInt(actualWeight.proofSize as string)
        }
      : undefined

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : (i => (i.Here ? 0 : (Array.isArray(i.x1) ? i.x1[0] : i.x1)?.parachain))(
            Object.values<any>(forwardedXcms[0])[0].interior
          )

    if (hasXcmPaymentApiSupport(chain) && asset) {
      const fee = await this.getXcmPaymentApiFee(chain, xcm, forwardedXcms, asset)

      if (typeof fee === 'bigint') {
        return {
          success: true,
          fee,
          currency: symbol,
          asset,
          weight,
          forwardedXcms,
          destParaId
        }
      }
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

  async convertLocationToAccount(location: TLocation): Promise<string | undefined> {
    const res = await this.api.call.locationToAccountApi.convertLocation(location)
    const jsonRes = res.toJSON() as any
    return jsonRes.ok ? jsonRes.ok.toString() : undefined
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

  validateSubstrateAddress(address: string): boolean {
    try {
      validateAddress(address)
      return true
    } catch {
      return false
    }
  }
}

export default PolkadotJsApi
