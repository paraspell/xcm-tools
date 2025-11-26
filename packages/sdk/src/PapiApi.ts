/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { blake2b } from '@noble/hashes/blake2'
import { bytesToHex } from '@noble/hashes/utils'
import type {
  IPolkadotApi,
  TAssetInfo,
  TBuilderOptions,
  TChain,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunError,
  TDryRunXcmBaseOptions,
  TLocation,
  TPallet,
  TSerializedExtrinsics,
  TSerializedStateQuery,
  TSubstrateChain,
  TWeight
} from '@paraspell/sdk-core'
import {
  assertHasLocation,
  BatchMode,
  ChainNotSupportedError,
  computeFeeFromDryRun,
  findNativeAssetInfoOrThrow,
  getAssetsObject,
  getChainProviders,
  hasXcmPaymentApiSupport,
  InvalidAddressError,
  isAssetEqual,
  isAssetXcEqual,
  isConfig,
  isRelayChain,
  localizeLocation,
  MissingChainApiError,
  padValueBy,
  Parents,
  replaceBigInt,
  Version,
  wrapTxBypass
} from '@paraspell/sdk-core'
import { withLegacy } from '@polkadot-api/legacy-provider'
import { AccountId, Binary, createClient, FixedSizeBinary, getSs58AddressInfo } from 'polkadot-api'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'
import { getWsProvider } from 'polkadot-api/ws-provider'
import { isAddress } from 'viem'

import { DEFAULT_TTL_MS, EXTENSION_MS, LEGACY_CHAINS, MAX_CLIENTS } from './consts'
import { processAssetsDepositedEvents } from './fee'
import { transform } from './PapiXcmTransformer'
import { createClientCache, type TClientKey } from './TimedCache'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import { findFailingEvent } from './utils'

const clientPool = createClientCache(
  MAX_CLIENTS,
  (_key, entry) => {
    entry.client.destroy()
  },
  EXTENSION_MS
)

const keyFromWs = (ws: string | string[]): TClientKey => {
  return Array.isArray(ws) ? JSON.stringify(ws) : ws
}

const createPolkadotClient = (ws: string | string[], useLegacy: boolean): TPapiApi => {
  const options = useLegacy ? { innerEnhancer: withLegacy() } : {}
  const provider = getWsProvider(ws, options)
  return createClient(useLegacy ? provider : withPolkadotSdkCompat(provider))
}

const leasePolkadotClient = (ws: string | string[], ttlMs: number, useLegacy: boolean) => {
  const key = keyFromWs(ws)
  let entry = clientPool.peek(key)

  if (!entry) {
    entry = { client: createPolkadotClient(ws, useLegacy), refs: 0, destroyWanted: false }
    clientPool.set(key, entry, ttlMs)
  }

  entry.refs += 1

  clientPool.revive(key, ttlMs)
  entry.destroyWanted = false

  return entry.client
}

const releasePolkadotClient = (ws: string | string[]) => {
  const key = keyFromWs(ws)
  const entry = clientPool.peek(key)

  if (!entry) {
    return
  }

  entry.refs -= 1

  if (entry.refs === 0 && entry.destroyWanted) {
    clientPool.delete(key)
  }
}

const isHex = (str: string) => {
  return typeof str === 'string' && /^0x[0-9a-fA-F]+$/.test(str)
}

const extractDryRunXcmFailureReason = (result: any): string => {
  const executionResult = result?.value?.execution_result

  const error = executionResult?.value?.error

  const failureType =
    error?.error?.type ??
    error?.value?.error?.type ??
    error?.value?.value?.type ??
    error?.value?.type ??
    error?.type

  if (typeof failureType === 'string') {
    return failureType
  }

  if (typeof executionResult?.type === 'string') {
    return executionResult.type
  }

  return JSON.stringify(result?.value ?? result ?? 'Unknown error structure', replaceBigInt)
}

class PapiApi implements IPolkadotApi<TPapiApi, TPapiTransaction> {
  private _config?: TBuilderOptions<TPapiApiOrUrl>
  private api: TPapiApi
  private _ttlMs = DEFAULT_TTL_MS
  private initialized = false
  private disconnectAllowed = true
  private _chain: TSubstrateChain

  constructor(config?: TBuilderOptions<TPapiApiOrUrl>) {
    this._config = config
  }

  getConfig() {
    return this._config
  }

  getApi() {
    return this.api
  }

  async init(chain: TChain, clientTtlMs: number = DEFAULT_TTL_MS) {
    if (this.initialized || chain === 'Ethereum') {
      return
    }

    this._ttlMs = clientTtlMs
    this._chain = chain

    const apiConfig = this.getApiConfigForChain(chain)

    // For development mode, api for each used chain must be provided
    if (isConfig(this._config) && this._config.development && !apiConfig) {
      throw new MissingChainApiError(chain)
    }

    this.api = await this.resolveApi(apiConfig, chain)

    this.initialized = true
  }

  private getApiConfigForChain(chain: TSubstrateChain): TPapiApiOrUrl | undefined {
    if (isConfig(this._config)) {
      return this._config.apiOverrides?.[chain]
    }
    return this._config
  }

  private async resolveApi(
    apiConfig: TPapiApiOrUrl | undefined,
    chain: TSubstrateChain
  ): Promise<TPapiApi> {
    if (!apiConfig) {
      const wsUrl = getChainProviders(chain)
      return this.createApiInstance(wsUrl, chain)
    }

    if (typeof apiConfig === 'string' || apiConfig instanceof Array) {
      return this.createApiInstance(apiConfig, chain)
    }

    return apiConfig
  }

  createApiInstance(wsUrl: string | string[], chain: TSubstrateChain) {
    const useLegacy = LEGACY_CHAINS.includes(chain)
    return Promise.resolve(leasePolkadotClient(wsUrl, this._ttlMs, useLegacy))
  }

  accountToHex(address: string, isPrefixed = true) {
    if (isHex(address)) return address

    const hex = FixedSizeBinary.fromAccountId32<32>(address).asHex()
    return isPrefixed ? hex : hex.slice(2)
  }

  accountToUint8a(address: string): Uint8Array {
    const result = getSs58AddressInfo(address)

    if (!result.isValid) {
      throw new InvalidAddressError(`Invalid address: ${address}`)
    }

    return result.publicKey
  }

  validateSubstrateAddress(address: string): boolean {
    const result = getSs58AddressInfo(address)
    return result.isValid
  }

  deserializeExtrinsics({ module, method, params }: TSerializedExtrinsics) {
    const transformedParams = transform(params)
    return this.api.getUnsafeApi().tx[module][method](transformedParams)
  }

  queryState<T>({ module, method, params }: TSerializedStateQuery): Promise<T> {
    return this.api.getUnsafeApi().query[module][method].getValue(...params.map(transform))
  }

  queryRuntimeApi<T>({ module, method, params }: TSerializedStateQuery): Promise<T> {
    return this.api.getUnsafeApi().apis[module][method](...params.map(transform))
  }

  callBatchMethod(calls: TPapiTransaction[], mode: BatchMode) {
    const method = mode === BatchMode.BATCH_ALL ? 'batch_all' : 'batch'
    return this.api
      .getUnsafeApi()
      .tx.Utility[method]({ calls: calls.map(call => call.decodedCall) })
  }

  callDispatchAsMethod(call: TPapiTransaction, address: string) {
    const origin = {
      type: 'system',
      value: {
        type: 'Signed',
        value: address
      }
    }
    return this.api
      .getUnsafeApi()
      .tx.Utility.dispatch_as({ as_origin: origin, call: call.decodedCall })
  }

  async objectToHex(obj: unknown) {
    const transformedObj = transform(obj)

    const tx = this.api.getUnsafeApi().tx.PolkadotXcm.send({
      dest: {
        type: Version.V4,
        value: {
          parents: Parents.ZERO,
          interior: {
            type: 'Here'
          }
        }
      },
      message: transformedObj
    })

    const removeFirst5Bytes = (hexString: string) => '0x' + hexString.slice(12)

    const encodedData = await tx.getEncodedData()
    return removeFirst5Bytes(encodedData.asHex())
  }

  hexToUint8a(hex: string) {
    return Binary.fromHex(hex).asBytes()
  }

  stringToUint8a(str: string) {
    return Binary.fromText(str).asBytes()
  }

  blake2AsHex(data: Uint8Array) {
    return `0x${bytesToHex(blake2b(data, { dkLen: 32 }))}`
  }

  async hasMethod(pallet: TPallet, method: string): Promise<boolean> {
    try {
      await this.api.getUnsafeApi().tx[pallet][method]().getEncodedData()
      return true
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes(`Runtime entry Tx(${pallet}.${method}) not found`)
      ) {
        return false
      }
      return true
    }
  }

  getMethod(tx: TPapiTransaction) {
    return tx.decodedCall.value.type
  }

  getTypeThenAssetCount(tx: TPapiTransaction): number | undefined {
    if (this.getMethod(tx) !== 'transfer_assets_using_type_and_then') return undefined
    return tx.decodedCall.value.value.assets.value.length
  }

  async calculateTransactionFee(tx: TPapiTransaction, address: string) {
    return tx.getEstimatedFees(address)
  }

  async quoteAhPrice(fromMl: TLocation, toMl: TLocation, amountIn: bigint, includeFee = true) {
    const transformedFromMl = transform(fromMl)
    const transformedToMl = transform(toMl)

    const response = await this.api
      .getUnsafeApi()
      .apis.AssetConversionApi.quote_price_exact_tokens_for_tokens(
        transformedFromMl,
        transformedToMl,
        amountIn,
        includeFee
      )

    return response ? BigInt(response) : undefined
  }

  getEvmStorage(contract: string, slot: string): Promise<string> {
    return this.api
      .getUnsafeApi()
      .query.EVM.AccountStorages.getKey(
        FixedSizeBinary.fromHex(contract),
        FixedSizeBinary.fromHex(slot)
      )
  }

  async getFromRpc(module: string, method: string, key: string): Promise<string> {
    const toSS58 = AccountId().dec
    const value = await this.api._request(`${module}_${method}`, [
      module === 'system' && isHex(key) && !isAddress(key) ? toSS58(key) : key
    ])
    return isHex(value) ? value : '0x' + value.toString(16).padStart(8, '0')
  }

  clone() {
    return new PapiApi(isConfig(this._config) ? this._config : undefined)
  }

  async createApiForChain(chain: TSubstrateChain) {
    const api = new PapiApi()
    await api.init(chain)
    return api
  }

  async getDryRunCall(
    options: TDryRunCallBaseOptions<TPapiTransaction>
  ): Promise<TDryRunChainResult> {
    const {
      tx,
      chain,
      destination,
      address,
      feeAsset,
      bypassOptions,
      useRootOrigin = false
    } = options
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new ChainNotSupportedError(`DryRunApi is not available on chain ${chain}`)
    }

    const DEFAULT_XCM_VERSION = 3

    const basePayload = {
      type: 'system',
      value: useRootOrigin
        ? {
            type: 'Root'
          }
        : {
            type: 'Signed',
            value: address
          }
    }

    const resolvedTx = useRootOrigin
      ? await wrapTxBypass(
          {
            ...options,
            api: this
          },
          bypassOptions
        )
      : tx

    const performDryRunCall = async (includeVersion: boolean): Promise<any> => {
      const callArgs: any[] = [basePayload, resolvedTx.decodedCall]
      if (includeVersion) {
        callArgs.push(DEFAULT_XCM_VERSION)
      }
      return this.api.getUnsafeApi().apis.DryRunApi.dry_run_call(...callArgs)
    }

    const getExecutionSuccessFromResult = (result: any): boolean => {
      const errorInEvents = findFailingEvent(result)
      return result?.success && result.value?.execution_result?.success && !errorInEvents
    }

    const findFailureObjectFromResult = (result: any) => {
      const executionResultValue = result?.value?.execution_result?.value

      if (executionResultValue?.error?.value?.value?.type) {
        return executionResultValue.error.value.value
      }

      if (executionResultValue?.error?.value?.type) {
        return executionResultValue.error.value
      }

      if (result?.value?.type) {
        return result.value
      }

      const erroredEvent = findFailingEvent(result)

      if (erroredEvent) {
        const result = erroredEvent.value.value.result
        return result.value.value.value ?? result.value.value
      }

      return result
    }

    const extractFailureReasonFromResult = (result: any): TDryRunError => {
      const obj = findFailureObjectFromResult(result)

      if (obj?.type && obj?.value?.error?.type) {
        return { failureReason: obj.type, failureSubReason: obj.value.error.type }
      }

      if (obj?.type) {
        return { failureReason: obj.type }
      }

      return {
        failureReason: JSON.stringify(
          result?.value ?? result ?? 'Unknown error structure',
          replaceBigInt
        )
      }
    }

    let result
    let isSuccess
    let failureOutputReason: TDryRunError = {
      failureReason: ''
    }

    result = await performDryRunCall(false)

    isSuccess = getExecutionSuccessFromResult(result)

    if (!isSuccess) {
      const initialFailureReason = extractFailureReasonFromResult(result)
      failureOutputReason = initialFailureReason

      if (initialFailureReason.failureReason === 'VersionedConversionFailed') {
        result = await performDryRunCall(true)
        isSuccess = getExecutionSuccessFromResult(result)

        if (!isSuccess) {
          failureOutputReason = extractFailureReasonFromResult(result)
        } else {
          failureOutputReason = { failureReason: '', failureSubReason: undefined }
        }
      }
    }

    const usedAsset = feeAsset ?? findNativeAssetInfoOrThrow(chain)
    const usedSymbol = usedAsset.symbol

    if (!isSuccess) {
      return Promise.resolve({
        success: false,
        failureReason: failureOutputReason.failureReason,
        failureSubReason: failureOutputReason.failureSubReason,
        currency: usedSymbol,
        asset: usedAsset
      })
    }

    const actualWeight = result.value.execution_result.value.actual_weight

    const weight: TWeight | undefined = actualWeight
      ? { refTime: actualWeight.ref_time, proofSize: actualWeight.proof_size }
      : undefined

    const forwardedXcms =
      result.value.forwarded_xcms.length > 0 ? result.value.forwarded_xcms[0] : []

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : forwardedXcms[0].value.interior.type === 'Here'
          ? 0
          : forwardedXcms[0].value.interior.value.value

    const nativeAsset = findNativeAssetInfoOrThrow(chain)

    const hasLocation = feeAsset ? Boolean(feeAsset.location) : Boolean(nativeAsset?.location)

    if (
      hasXcmPaymentApiSupport(chain) &&
      result.value.local_xcm &&
      hasLocation &&
      (feeAsset || (chain.startsWith('AssetHub') && destination === 'Ethereum'))
    ) {
      const xcmFee = await this.getXcmPaymentApiFee(
        chain,
        result.value.local_xcm,
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
    const fee = computeFeeFromDryRun(result, chain, executionFee, !!feeAsset)

    return Promise.resolve({
      success: true,
      fee,
      currency: usedSymbol,
      asset: usedAsset,
      weight,
      forwardedXcms,
      destParaId
    })
  }

  async getXcmWeight(xcm: any): Promise<TWeight> {
    const weightResult = await this.api
      .getUnsafeApi()
      .apis.XcmPaymentApi.query_xcm_weight(!xcm.type ? transform(xcm) : xcm)

    const { ref_time, proof_size } = weightResult.value

    return {
      refTime: ref_time,
      proofSize: proof_size
    }
  }

  async getXcmPaymentApiFee(
    chain: TSubstrateChain,
    localXcm: any,
    forwardedXcm: any,
    asset: TAssetInfo,
    transformXcm = false
  ): Promise<bigint> {
    const transformedXcm = transformXcm ? transform(localXcm) : localXcm

    const weight = await this.api.getUnsafeApi().apis.XcmPaymentApi.query_xcm_weight(transformedXcm)

    assertHasLocation(asset)

    const assetLocalizedLoc = localizeLocation(chain, asset.location)

    const transformedAssetLoc = transform(assetLocalizedLoc)

    const execFeeRes = await this.api
      .getUnsafeApi()
      .apis.XcmPaymentApi.query_weight_to_asset_fee(weight.value, {
        type: Version.V4,
        value: transformedAssetLoc
      })

    const deliveryFeeRes =
      forwardedXcm.length > 0
        ? await this.api
            .getUnsafeApi()
            .apis.XcmPaymentApi.query_delivery_fees(forwardedXcm[0], forwardedXcm[1][0])
        : undefined

    const deliveryFeeResolved =
      deliveryFeeRes?.value?.value.length > 0 ? deliveryFeeRes?.value?.value[0].fun.value : 0n

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
      } catch (e) {
        if (e instanceof Error && /Runtime entry RuntimeCall\(.+\) not found/.test(e.message)) {
          deliveryFee = 0n
        } else {
          deliveryFee = 0n
        }
      }
    }

    return execFeeRes.value + deliveryFee
  }

  async getDryRunXcm({
    originLocation,
    xcm,
    chain,
    origin,
    asset,
    feeAsset,
    originFee,
    amount
  }: TDryRunXcmBaseOptions<TPapiTransaction>): Promise<TDryRunChainResult> {
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new ChainNotSupportedError(`DryRunApi is not available on chain ${chain}`)
    }

    const transformedOriginLocation = transform(originLocation)

    const result = await this.api
      .getUnsafeApi()
      .apis.DryRunApi.dry_run_xcm(transformedOriginLocation, xcm)

    const symbol = asset.symbol

    const isSuccess = result.success && result.value.execution_result.type === 'Complete'
    if (!isSuccess) {
      const failureReason = extractDryRunXcmFailureReason(result)

      return { success: false, failureReason, currency: symbol, asset }
    }

    const actualWeight = result.value.execution_result.value.used

    const weight: TWeight | undefined = actualWeight
      ? { refTime: actualWeight.ref_time, proofSize: actualWeight.proof_size }
      : undefined

    const forwardedXcms =
      result.value.forwarded_xcms.length > 0 ? result.value.forwarded_xcms[0] : []

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : forwardedXcms[0].value.interior.type === 'Here'
          ? 0
          : forwardedXcms[0].value.interior.value.value

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

    const emitted = result.value.emitted_events

    // We want to look for the last event
    const reversedEvents = [...emitted].reverse()

    const palletsWithIssued = ['Balances', 'ForeignAssets', 'Assets']

    const isFeeAsset =
      origin === 'AssetHubPolkadot' && feeAsset && asset && isAssetEqual(feeAsset, asset)

    const feeAssetFeeEvent =
      (isFeeAsset
        ? [...emitted].find(
            event =>
              (event.type === 'ForeignAssets' || event.type === 'Assets') &&
              event.value.type === 'Issued'
          )
        : undefined) ??
      (isFeeAsset
        ? [...emitted].find(event => event.type === 'Tokens' && event.value.type === 'Deposited')
        : undefined)

    const processedAssetsAmount =
      chain === 'AssetHubPolkadot' && asset?.symbol !== 'DOT'
        ? processAssetsDepositedEvents(emitted, amount, 'Assets', 'Deposited', true)
        : (processAssetsDepositedEvents(emitted, amount, 'Balances', 'Minted', false) ??
          processAssetsDepositedEvents(emitted, amount, 'Balances', 'Issued', false))

    const feeEvent =
      feeAssetFeeEvent ??
      //
      (processedAssetsAmount !== undefined
        ? {
            type: 'Assets',
            value: {
              type: 'Deposited',
              value: { amount: processedAssetsAmount }
            }
          }
        : undefined) ??
      //
      (chain === 'Mythos'
        ? reversedEvents.find(event => event.type === 'Balances' && event.value.type === 'Issued')
        : undefined) ??
      //
      (origin === 'Mythos' || (chain === 'AssetHubPolkadot' && asset?.symbol !== 'DOT')
        ? reversedEvents.find(
            event => event.type === 'AssetConversion' && event.value.type === 'SwapCreditExecuted'
          )
        : undefined) ??
      // Prefer to Minted event
      reversedEvents.find(
        event => ['Balances', 'ForeignAssets'].includes(event.type) && event.value.type === 'Minted'
      ) ??
      // Fallback an Issued event
      reversedEvents.find(
        (event: any) => palletsWithIssued.includes(event.type) && event.value.type === 'Issued'
      ) ??
      reversedEvents.find(
        event => ['Currencies', 'Tokens'].includes(event.type) && event.value.type === 'Deposited'
      )

    if (!feeEvent) {
      return Promise.resolve({
        success: false,
        failureReason: 'Cannot determine destination fee. No fee event found',
        currency: symbol,
        asset
      })
    }

    let fee =
      feeEvent.type === 'AssetConversion'
        ? feeEvent.value.value.amount_in
        : feeEvent.value.value.amount

    if (feeAssetFeeEvent) {
      fee = amount - originFee - feeEvent.value.value.amount
    }

    const processedFee =
      (isRelayChain(chain) || chain.includes('AssetHub')) && asset?.symbol === 'DOT'
        ? padValueBy(fee, 30)
        : fee

    return Promise.resolve({
      success: true,
      fee: processedFee,
      currency: symbol,
      asset,
      weight,
      forwardedXcms,
      destParaId
    })
  }

  async getBridgeStatus() {
    const outboundOperatingMode = await this.api
      .getUnsafeApi()
      .query.EthereumOutboundQueue.OperatingMode.getValue()
    return outboundOperatingMode.type
  }

  setDisconnectAllowed(allowed: boolean) {
    this.disconnectAllowed = allowed
  }

  getDisconnectAllowed() {
    return this.disconnectAllowed
  }

  disconnect(force = false) {
    if (!this.initialized) return Promise.resolve()
    if (!force && !this.disconnectAllowed) return Promise.resolve()

    const api = isConfig(this._config) ? this._config.apiOverrides?.[this._chain] : this._config

    // Own client provided, destroy only if force true
    if (force && typeof api === 'object') {
      this.api.destroy()
    }

    // Client created automatically
    if (typeof api === 'string' || Array.isArray(api) || api === undefined) {
      if (force) {
        this.api.destroy()
      } else {
        const key = api === undefined ? getChainProviders(this._chain) : api
        releasePolkadotClient(key)
      }
    }

    return Promise.resolve()
  }
}

export default PapiApi
