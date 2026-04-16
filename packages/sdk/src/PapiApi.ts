/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { blake2b } from '@noble/hashes/blake2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import type {
  TAssetInfo,
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
  createAssetId,
  createClientCache,
  createClientPoolHelpers,
  DEFAULT_TTL_MS,
  EXTENSION_MS,
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
  MAX_CLIENTS,
  padValueBy,
  Parents,
  PolkadotApi,
  RELAY_LOCATION,
  replaceBigInt,
  resolveChainApi,
  RuntimeApiError,
  RuntimeApiUnavailableError,
  SubmitTransactionError,
  wrapTxBypass
} from '@paraspell/sdk-core'
import type { TypedApi } from 'polkadot-api'
import { AccountId, Binary, getSs58AddressInfo } from 'polkadot-api'
import { toHex } from 'polkadot-api/utils'
import { createWsClient } from 'polkadot-api/ws'
import { isAddress, isHex } from 'viem'

import { processAssetsDepositedEvents } from './fee'
import { transform } from './PapiXcmTransformer'
import type { TPapiApi, TPapiSigner, TPapiTransaction } from './types'
import {
  computeOriginFee,
  createDevSigner,
  deriveAddress,
  extractDestParaId,
  findFailingEvent
} from './utils'

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

const { leaseClient, releaseClient } = createClientPoolHelpers(clientPool, createWsClient)

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

class PapiApi extends PolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner> {
  public readonly type = 'PAPI'

  async init(chain: TChain, clientTtlMs: number = DEFAULT_TTL_MS) {
    if (this._chain !== undefined || isExternalChain(chain)) {
      return
    }

    this._ttlMs = clientTtlMs
    this._chain = chain

    this._api = await resolveChainApi(this._config, chain, wsUrl => leaseClient(wsUrl, this._ttlMs))
  }

  _untypedApi: TypedApi<any, false> | null = null

  private get untypedApi() {
    if (!this._untypedApi) this._untypedApi = this.api.getUnsafeApi()
    return this._untypedApi
  }

  createApiInstance(wsUrl: TUrl): Promise<TPapiApi> {
    return Promise.resolve(createWsClient(wsUrl))
  }

  accountToHex(address: string, isPrefixed = true) {
    if (isHex(address)) return address
    const hex = toHex(AccountId().enc(address))
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
    return this.untypedApi.tx[module][method](transformedParams)
  }

  txFromHex(hex: string): Promise<TPapiTransaction> {
    const callData = Binary.fromHex(hex)
    return this.untypedApi.txFromCallData(callData)
  }

  queryState<T>({ module, method, params }: TSerializedStateQuery): Promise<T> {
    return this.untypedApi.query[module][method].getValue(...params.map(transform)) as Promise<T>
  }

  queryRuntimeApi<T>({ module, method, params }: TSerializedStateQuery): Promise<T> {
    return this.untypedApi.apis[module][method](...params.map(transform)) as Promise<T>
  }

  callBatchMethod(calls: TPapiTransaction[], mode: BatchMode) {
    const method = mode === BatchMode.BATCH_ALL ? 'batch_all' : 'batch'
    return this.untypedApi.tx.Utility[method]({
      calls: calls.map(({ decodedCall }) => decodedCall)
    })
  }

  callDispatchAsMethod({ decodedCall }: TPapiTransaction, address: string) {
    const origin = {
      type: 'system',
      value: {
        type: 'Signed',
        value: address
      }
    }
    return this.untypedApi.tx.Utility.dispatch_as({ as_origin: origin, call: decodedCall })
  }

  async objectToHex(obj: unknown, _typeName: string, version: Version) {
    const transformedObj = transform(obj)

    const tx = this.untypedApi.tx.PolkadotXcm.send({
      dest: {
        type: version,
        value: {
          parents: Parents.ZERO,
          interior: { type: 'Here' }
        }
      },
      message: transformedObj
    })

    const removeFirst5Bytes = (hexString: string) => '0x' + hexString.slice(12)

    const encodedData = await tx.getEncodedData()
    return removeFirst5Bytes(toHex(encodedData))
  }

  hexToUint8a(hex: string) {
    return Binary.fromHex(hex)
  }

  stringToUint8a(str: string) {
    return Binary.fromText(str)
  }

  blake2AsHex(data: Uint8Array) {
    return `0x${bytesToHex(blake2b(data, { dkLen: 32 }))}`
  }

  async hasMethod(pallet: TPallet, method: string): Promise<boolean> {
    try {
      await this.untypedApi.tx[pallet][method]().getEncodedData()
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

    const response: any =
      await this.untypedApi.apis.AssetConversionApi.quote_price_exact_tokens_for_tokens(
        transformedFromMl,
        transformedToMl,
        amountIn,
        includeFee
      )

    return response ? BigInt(response) : undefined
  }

  getEvmStorage(contract: string, slot: string): Promise<string> {
    return this.untypedApi.query.EVM.AccountStorages.getKey(contract, slot)
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
    const api = new PapiApi(isConfig(this._config) ? this._config : undefined)
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

    const assetId =
      await this.untypedApi.query.MultiTransactionPayment.AccountCurrencyMap.getValue(address)

    if (assetId === undefined)
      return { isCustomAsset: false, asset: this.resolveDefaultFeeAsset(options) }

    return { isCustomAsset: true, asset: findAssetInfoOrThrow(chain, { id: assetId as number }) }
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
    const { supportsDryRunApi } = getAssetsObject(chain)

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

    const performDryRunCall = (includeVersion: boolean): Promise<any> => {
      const callArgs: any[] = [basePayload, resolvedTx.decodedCall]
      if (includeVersion) {
        const versionNum = Number(version.charAt(1))
        callArgs.push(versionNum)
      }

      return this.untypedApi.apis.DryRunApi.dry_run_call(...callArgs)
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

    try {
      result = await performDryRunCall(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      if (message.includes('Incompatible runtime entry')) {
        result = await performDryRunCall(true)
      } else {
        throw e
      }
    }

    const isSuccess = getExecutionSuccessFromResult(result)

    let resolvedFeeAsset = await this.resolveFeeAsset(options)

    if (!isSuccess) {
      const failureOutputReason = extractFailureReasonFromResult(result)
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

    const destParaId = extractDestParaId(forwardedXcms)

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
    const fee = computeOriginFee(result, chain, executionFee, !!feeAsset)

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
    const weightRes: any = await this.untypedApi.apis.XcmPaymentApi.query_xcm_weight(
      !xcm.type ? transform(xcm) : xcm
    )

    const { success, value } = weightRes

    if (!success)
      throw new RuntimeApiError(
        `Failed to get XCM weight for payment fee calculation. Reason: ${JSON.stringify(value)}`
      )

    const { ref_time, proof_size } = value

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
    const xcmPaymentApi = this.untypedApi.apis.XcmPaymentApi

    let usedThirdParam = false
    let deliveryFeeRes: any

    if (forwardedXcm.length > 0) {
      const baseArgs = [forwardedXcm[0], forwardedXcm[1][0]] as const

      try {
        deliveryFeeRes = await xcmPaymentApi.query_delivery_fees(...baseArgs)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)

        // Some runtimes require the 3rd arg
        if (message.includes('Incompatible runtime entry')) {
          usedThirdParam = true
          const assetId = createAssetId(version, assetLocalizedLoc)
          const transformedAssetLoc = transform(addXcmVersionHeader(assetId, version))
          deliveryFeeRes = await xcmPaymentApi.query_delivery_fees(...baseArgs, transformedAssetLoc)
        } else {
          throw e
        }
      }
    }

    if (deliveryFeeRes?.value?.type === 'Unimplemented') {
      return 0n
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
      const weightRes: any =
        await this.untypedApi.apis.XcmPaymentApi.query_xcm_weight(transformedXcm)

      if (!weightRes.success)
        throw new RuntimeApiError(
          `Failed to get XCM weight for payment fee calculation. Reason: ${JSON.stringify(weightRes.value)}`
        )

      return weightRes.value
    }

    const weight = overridenWeight
      ? { proof_size: overridenWeight?.proofSize, ref_time: overridenWeight?.refTime }
      : await queryWeight()

    const assetLocalizedLoc = localizeLocation(chain, asset.location)

    const assetId = createAssetId(version, assetLocalizedLoc)
    const versionedAssetId = addXcmVersionHeader(assetId, version)

    const transformedAssetLoc = transform(versionedAssetId)

    const execFeeRes: any = await this.untypedApi.apis.XcmPaymentApi.query_weight_to_asset_fee(
      weight,
      transformedAssetLoc
    )

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
    const fallbackExecFeeRes: any =
      await this.untypedApi.apis.XcmPaymentApi.query_weight_to_asset_fee(weightValue, {
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
    const { supportsDryRunApi } = getAssetsObject(chain)

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, 'DryRunApi')
    }

    const transformedOriginLocation = transform(originLocation)

    const result: any = await this.untypedApi.apis.DryRunApi.dry_run_xcm(
      transformedOriginLocation,
      xcm
    )

    const isSuccess = result.success && result.value.execution_result.type === 'Complete'
    if (!isSuccess) {
      const failureReason = extractDryRunXcmFailureReason(result)
      return { success: false, failureReason, asset }
    }

    const execResult = result.value.execution_result

    const weight: TWeight | undefined =
      execResult.type === 'Complete'
        ? { refTime: execResult.value.used.ref_time, proofSize: execResult.value.used.proof_size }
        : undefined

    const forwardedXcms =
      result.value.forwarded_xcms.length > 0 ? result.value.forwarded_xcms[0] : []

    const destParaId = extractDestParaId(forwardedXcms)

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
        ? [...emitted].find(
            event => (event.type as string) === 'Tokens' && event.value.type === 'Deposited'
          )
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

    const feeEventValue = feeEvent.value.value

    let fee = feeEvent.type === 'AssetConversion' ? feeEventValue.amount_in : feeEventValue.amount

    if (feeAssetFeeEvent) {
      fee = amount - originFee - feeEventValue.amount
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
    const mode = (await this.untypedApi.query.EthereumOutboundQueue.OperatingMode.getValue()) as any
    return mode.type
  }

  disconnect(force = false) {
    if (!this._chain) return Promise.resolve()
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

  async signAndSubmitFinalized(
    tx: TPapiTransaction,
    sender: TSender<TPapiSigner>
  ): Promise<string> {
    const signer = isSenderSigner(sender) ? sender : createDevSigner(sender)
    return new Promise((resolve, reject) => {
      tx.signSubmitAndWatch(signer).subscribe({
        next: event => {
          if (event.type === 'finalized' || (event.type === 'txBestBlocksState' && event.found)) {
            if (!event.ok) {
              reject(new SubmitTransactionError(JSON.stringify(event.dispatchError.value)))
            } else {
              resolve(event.txHash)
            }
          }
        },
        error: error => {
          reject(error instanceof Error ? error : new SubmitTransactionError(String(error)))
        }
      })
    })
  }
}

export default PapiApi
