/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { blake2b } from '@noble/hashes/blake2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
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
  TPaymentInfo,
  TSender,
  TSerializedExtrinsics,
  TSerializedStateQuery,
  TSubstrateChain,
  TUrl,
  TWeight,
  Version
} from '@paraspell/sdk-core'
import {
  addXcmVersionHeader,
  BatchMode,
  computeFeeFromDryRun,
  createClientCache,
  createClientPoolHelpers,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getAssetsObject,
  getChainProviders,
  getRelayChainOf,
  hasXcmPaymentApiSupport,
  InvalidAddressError,
  isAssetEqual,
  isAssetXcEqual,
  isConfig,
  isExternalChain,
  isRelayChain,
  isSenderSigner,
  localizeLocation,
  MissingChainApiError,
  padValueBy,
  Parents,
  RELAY_LOCATION,
  replaceBigInt,
  RuntimeApiUnavailableError,
  wrapTxBypass
} from '@paraspell/sdk-core'
import { withLegacy } from '@polkadot-api/legacy-provider'
import { AccountId, Binary, createClient, FixedSizeBinary, getSs58AddressInfo } from 'polkadot-api'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'
import { getWsProvider } from 'polkadot-api/ws-provider'
import { isAddress, isHex } from 'viem'

import { DEFAULT_TTL_MS, EXTENSION_MS, LEGACY_CHAINS, MAX_CLIENTS } from './consts'
import { processAssetsDepositedEvents } from './fee'
import { transform } from './PapiXcmTransformer'
import type { TPapiApi, TPapiApiOrUrl, TPapiSigner, TPapiTransaction } from './types'
import { createDevSigner, deriveAddress, findFailingEvent } from './utils'

const clientPool = createClientCache<TPapiApi>(
  MAX_CLIENTS,
  async client => {
    await client.getChainSpecData()
  },
  (_key, entry) => {
    entry.client.destroy()
  },
  EXTENSION_MS
)

const createPolkadotClient = (ws: TUrl, useLegacy: boolean): TPapiApi => {
  const options = useLegacy ? { innerEnhancer: withLegacy() } : {}
  const provider = getWsProvider(ws, options)
  return createClient(useLegacy ? provider : withPolkadotSdkCompat(provider))
}

const { leaseClient, releaseClient } = createClientPoolHelpers(clientPool, createPolkadotClient)

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

class PapiApi implements IPolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner> {
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
    if (this.initialized || isExternalChain(chain)) {
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

  private resolveApi(
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

    return Promise.resolve(apiConfig)
  }

  createApiInstance(wsUrl: TUrl, chain: TSubstrateChain) {
    const useLegacy = LEGACY_CHAINS.includes(chain)
    return Promise.resolve(leaseClient(wsUrl, this._ttlMs, useLegacy))
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

  async txFromHex(hex: string): Promise<TPapiTransaction> {
    const callData = Binary.fromHex(hex)
    return this.api.getUnsafeApi().txFromCallData(callData)
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

  async objectToHex(obj: unknown, _typeName: string, version: Version) {
    const transformedObj = transform(obj)

    const tx = this.api.getUnsafeApi().tx.PolkadotXcm.send({
      dest: {
        type: version,
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

  async getPaymentInfo(tx: TPapiTransaction, address: string): Promise<TPaymentInfo> {
    const {
      partial_fee,
      weight: { proof_size, ref_time }
    } = await tx.getPaymentInfo(address)

    return {
      partialFee: partial_fee,
      weight: {
        proofSize: proof_size,
        refTime: ref_time
      }
    }
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
    const value = await this.api._request(`${module}_${method}`, [
      module === 'system' && isHex(key) && !isAddress(key) ? AccountId().dec(key) : key
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

  resolveDefaultFeeAsset({ chain, feeAsset }: TDryRunCallBaseOptions<TPapiTransaction>) {
    return feeAsset ?? findNativeAssetInfoOrThrow(chain)
  }

  async resolveFeeAsset(options: TDryRunCallBaseOptions<TPapiTransaction>) {
    const { chain, address, feeAsset } = options

    if (!chain.startsWith('Hydration') || feeAsset)
      return { isCustomAsset: false, asset: this.resolveDefaultFeeAsset(options) }

    const assetId = await this.api
      .getUnsafeApi()
      .query.MultiTransactionPayment.AccountCurrencyMap.getValue(address)

    if (assetId === undefined)
      return { isCustomAsset: false, asset: this.resolveDefaultFeeAsset(options) }

    return { isCustomAsset: true, asset: findAssetInfoOrThrow(chain, { id: assetId }, null) }
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
      version,
      useRootOrigin = false
    } = options
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, 'DryRunApi')
    }

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
        const versionNum = Number(version.charAt(1))
        callArgs.push(versionNum)
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

      if (executionResultValue?.error?.type) {
        return executionResultValue.error
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

    let resolvedFeeAsset = await this.resolveFeeAsset(options)

    if (!isSuccess) {
      return Promise.resolve({
        success: false,
        failureReason: failureOutputReason.failureReason,
        failureSubReason: failureOutputReason.failureSubReason,
        asset: resolvedFeeAsset.asset
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

    const USE_XCM_PAYMENT_API_CHAINS: TSubstrateChain[] = ['Astar']

    if (
      (hasXcmPaymentApiSupport(chain) &&
        result.value.local_xcm &&
        (feeAsset ||
          USE_XCM_PAYMENT_API_CHAINS.includes(chain) ||
          (chain.startsWith('AssetHub') && destination === 'Ethereum'))) ||
      resolvedFeeAsset.isCustomAsset
    ) {
      const overriddenWeight = !result.value.local_xcm
        ? (await this.getPaymentInfo(tx, address)).weight
        : undefined

      const xcmFee = await this.getXcmPaymentApiFee(
        chain,
        result.value.local_xcm,
        forwardedXcms,
        resolvedFeeAsset.asset,
        version,
        false,
        overriddenWeight
      )

      if (typeof xcmFee === 'bigint') {
        return Promise.resolve({
          success: true,
          fee: xcmFee,
          asset: resolvedFeeAsset.asset,
          weight,
          forwardedXcms,
          destParaId
        })
      } else {
        resolvedFeeAsset = { isCustomAsset: false, asset: this.resolveDefaultFeeAsset(options) }
      }
    }

    const { partialFee: executionFee } = await this.getPaymentInfo(tx, address)
    const fee = computeFeeFromDryRun(result, chain, executionFee, !!feeAsset)

    return Promise.resolve({
      success: true,
      fee,
      asset: resolvedFeeAsset.asset,
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

  async getDeliveryFee(
    chain: TSubstrateChain,
    forwardedXcm: any[],
    asset: TAssetInfo,
    assetLocalizedLoc: TLocation,
    version: Version
  ): Promise<bigint> {
    const xcmPaymentApi = this.api.getUnsafeApi().apis.XcmPaymentApi

    let usedThirdParam = false
    let deliveryFeeRes: any

    if (forwardedXcm.length > 0) {
      const baseArgs = [forwardedXcm[0], forwardedXcm[1][0]] as const

      try {
        deliveryFeeRes = await xcmPaymentApi.query_delivery_fees(...baseArgs)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)

        // Some runtimes require the 3rd arg; without it the runtime-api call can throw
        // with a generic "Cannot read properties of undefined".
        if (message.includes('Cannot read properties of undefined')) {
          usedThirdParam = true
          const transformedAssetLoc = transform(addXcmVersionHeader(assetLocalizedLoc, version))
          deliveryFeeRes = await xcmPaymentApi.query_delivery_fees(...baseArgs, transformedAssetLoc)
        } else {
          throw e
        }
      }
    }

    const deliveryFeeResolved =
      deliveryFeeRes?.value?.value.length > 0 ? deliveryFeeRes?.value?.value[0].fun.value : 0n

    const nativeAsset = findNativeAssetInfoOrThrow(chain)

    if (isAssetXcEqual(asset, nativeAsset) || usedThirdParam) {
      return deliveryFeeResolved
    } else {
      try {
        const res = await this.quoteAhPrice(
          localizeLocation(chain, nativeAsset.location),
          assetLocalizedLoc,
          deliveryFeeResolved,
          false
        )

        return res ?? 0n
      } catch (e) {
        if (e instanceof Error && /Runtime entry RuntimeCall\(.+\) not found/.test(e.message)) {
          return 0n
        } else {
          return 0n
        }
      }
    }
  }

  async getXcmPaymentApiFee(
    chain: TSubstrateChain,
    localXcm: any,
    forwardedXcm: any,
    asset: TAssetInfo,
    version: Version,
    transformXcm = false,
    overridenWeight?: TWeight
  ): Promise<bigint> {
    const transformedXcm = transformXcm ? transform(localXcm) : localXcm

    const queryWeight = async () => {
      const weightRes = await this.api
        .getUnsafeApi()
        .apis.XcmPaymentApi.query_xcm_weight(transformedXcm)
      return weightRes.value
    }

    const weight = overridenWeight
      ? { proof_size: overridenWeight?.proofSize, ref_time: overridenWeight?.refTime }
      : await queryWeight()

    const assetLocalizedLoc = localizeLocation(chain, asset.location)

    const transformedAssetLoc = transform(assetLocalizedLoc)

    const execFeeRes = await this.api
      .getUnsafeApi()
      .apis.XcmPaymentApi.query_weight_to_asset_fee(weight, {
        type: version,
        value: transformedAssetLoc
      })

    let execFee = typeof execFeeRes?.value === 'bigint' ? execFeeRes.value : 0n

    if (
      chain.startsWith('BridgeHub') &&
      execFeeRes?.success === false &&
      execFeeRes?.value?.type === 'AssetNotFound'
    ) {
      const bridgeHubExecFee = await this.getBridgeHubFallbackExecFee(chain, weight, asset, version)

      if (typeof bridgeHubExecFee === 'bigint') {
        execFee = bridgeHubExecFee
      }
    }

    const deliveryFee = await this.getDeliveryFee(
      chain,
      forwardedXcm,
      asset,
      assetLocalizedLoc,
      version
    )

    return execFee + deliveryFee
  }

  async getBridgeHubFallbackExecFee(
    chain: TSubstrateChain,
    weightValue: any,
    asset: TAssetInfo,
    version: Version
  ): Promise<bigint | undefined> {
    const fallbackExecFeeRes = await this.api
      .getUnsafeApi()
      .apis.XcmPaymentApi.query_weight_to_asset_fee(weightValue, {
        type: version,
        value: transform(RELAY_LOCATION)
      })

    if (typeof fallbackExecFeeRes?.value !== 'bigint') {
      return undefined
    }

    const ahApi = this.clone()

    const assetHubChain = `AssetHub${getRelayChainOf(chain)}` as TSubstrateChain

    await ahApi.init(assetHubChain)

    const ahLocalizedLoc = localizeLocation(assetHubChain, asset.location)

    const convertedExecFee = await ahApi.quoteAhPrice(
      RELAY_LOCATION,
      ahLocalizedLoc,
      fallbackExecFeeRes.value,
      false
    )

    if (typeof convertedExecFee === 'bigint') {
      return convertedExecFee
    }

    return undefined
  }

  async getDryRunXcm({
    originLocation,
    xcm,
    chain,
    origin,
    asset,
    feeAsset,
    originFee,
    amount,
    version
  }: TDryRunXcmBaseOptions<TPapiTransaction>): Promise<TDryRunChainResult> {
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, 'DryRunApi')
    }

    const transformedOriginLocation = transform(originLocation)

    const result = await this.api
      .getUnsafeApi()
      .apis.DryRunApi.dry_run_xcm(transformedOriginLocation, xcm)

    const isSuccess = result.success && result.value.execution_result.type === 'Complete'
    if (!isSuccess) {
      const failureReason = extractDryRunXcmFailureReason(result)

      return { success: false, failureReason, asset }
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
      const fee = await this.getXcmPaymentApiFee(chain, xcm, forwardedXcms, asset, version)

      if (typeof fee === 'bigint') {
        return {
          success: true,
          fee,
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
      (chain === 'Mythos'
        ? reversedEvents.find(event => event.type === 'Balances' && event.value.type === 'Issued')
        : undefined) ??
      (processedAssetsAmount !== undefined
        ? {
            type: 'Assets',
            value: {
              type: 'Deposited',
              value: { amount: processedAssetsAmount }
            }
          }
        : undefined) ??
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
        releaseClient(key)
      }
    }

    return Promise.resolve()
  }

  deriveAddress(sender: TSender<TPapiSigner>): string {
    return deriveAddress(sender)
  }

  async signAndSubmit(tx: TPapiTransaction, sender: TSender<TPapiSigner>): Promise<string> {
    const signer = isSenderSigner(sender) ? sender : createDevSigner(sender)
    const { txHash } = await tx.signAndSubmit(signer)
    return txHash
  }
}

export default PapiApi
