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
  createClientCache,
  createClientPoolHelpers,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getChainProviders,
  getRelayChainOf,
  hasXcmPaymentApiSupport,
  isAssetXcEqual,
  isConfig,
  isExternalChain,
  isSenderSigner,
  localizeLocation,
  RELAY_LOCATION,
  RuntimeApiUnavailableError,
  UnsupportedOperationError,
  wrapTxBypass
} from '@paraspell/sdk-core'
import {
  computeFeeFromDryRunPjs,
  getAssetsObject,
  type IPolkadotApi,
  MissingChainApiError,
  resolveModuleError
} from '@paraspell/sdk-core'
import { ApiPromise, WsProvider } from '@polkadot/api'
import type { Codec } from '@polkadot/types/types'
import { hexToU8a, isHex, stringToU8a, u8aToHex } from '@polkadot/util'
import { blake2AsHex, decodeAddress, validateAddress } from '@polkadot/util-crypto'

import { DEFAULT_TTL_MS, EXTENSION_MS, MAX_CLIENTS } from './consts'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl, TPjsSigner } from './types'
import { createKeyringPair, lowercaseFirstLetter, snakeToCamel } from './utils'

const clientPool = createClientCache<TPjsApi>(
  MAX_CLIENTS,
  async client => {
    await client.rpc.system.properties()
  },
  (_key, entry) => {
    void entry.client.disconnect()
  },
  EXTENSION_MS
)

const createPolkadotJsClient = async (ws: TUrl): Promise<TPjsApi> => {
  const wsProvider = new WsProvider(ws)
  return ApiPromise.create({ provider: wsProvider })
}

const { leaseClient, releaseClient } = createClientPoolHelpers(clientPool, createPolkadotJsClient)

class PolkadotJsApi implements IPolkadotApi<TPjsApi, Extrinsic, TPjsSigner> {
  private _config?: TBuilderOptions<TPjsApiOrUrl>
  private api: TPjsApi
  private _ttlMs = DEFAULT_TTL_MS
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

  async init(chain: TChain, clientTtlMs: number = DEFAULT_TTL_MS) {
    if (this.initialized || isExternalChain(chain)) {
      return
    }

    this._ttlMs = clientTtlMs
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

  private resolveApi(
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

    return Promise.resolve(apiConfig)
  }

  createApiInstance(wsUrl: TUrl, _chain: TSubstrateChain) {
    return leaseClient(wsUrl, this._ttlMs, false)
  }

  accountToHex(address: string, isPrefixed = true) {
    if (isHex(address)) return address
    const uint8Array = decodeAddress(address)
    return u8aToHex(uint8Array, -1, isPrefixed)
  }

  accountToUint8a(address: string): Uint8Array {
    return decodeAddress(address)
  }

  private convertToPjsCall<T extends TSerializedExtrinsics | TSerializedStateQuery>({
    module,
    method
  }: T) {
    return {
      module: lowercaseFirstLetter(module),
      method: snakeToCamel(method)
    }
  }

  deserializeExtrinsics(serialized: TSerializedExtrinsics) {
    const { params } = serialized
    const values = Object.values(params)
    const { module, method } = this.convertToPjsCall(serialized)
    return this.api.tx[module][method](...values)
  }

  txFromHex(hex: string): Promise<Extrinsic> {
    return Promise.resolve(this.api.tx(hex))
  }

  async queryState<T>(serialized: TSerializedStateQuery): Promise<T> {
    const { params } = serialized
    const { module, method } = this.convertToPjsCall(serialized)
    const res = await this.api.query[module][method](...params)
    return res.toJSON() as T
  }

  queryRuntimeApi<T>(serialized: TSerializedStateQuery): Promise<T> {
    const { params } = serialized
    const { module, method } = this.convertToPjsCall(serialized)
    return this.api.call[module][method](...params)
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

  async getPaymentInfo(tx: Extrinsic, address: string): Promise<TPaymentInfo> {
    const {
      weight: { proofSize, refTime },
      partialFee
    } = await tx.paymentInfo(address)
    return {
      weight: {
        proofSize: proofSize.toBigInt(),
        refTime: refTime.toBigInt()
      },
      partialFee: partialFee.toBigInt()
    }
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

  getMethod(tx: Extrinsic): string {
    return tx.method.method
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
      throw new UnsupportedOperationError(`RPC method ${module}.${method} not available`)
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

  resolveDefaultFeeAsset({ chain, feeAsset }: TDryRunCallBaseOptions<Extrinsic>) {
    return feeAsset ?? findNativeAssetInfoOrThrow(chain)
  }

  async resolveFeeAsset(options: TDryRunCallBaseOptions<Extrinsic>) {
    const { chain, address } = options

    if (!chain.startsWith('Hydration')) {
      return { isCustomAsset: false, asset: this.resolveDefaultFeeAsset(options) }
    }

    const response = await this.api.query.multiTransactionPayment.accountCurrencyMap(address)
    const assetId = response.toJSON() as any

    if (assetId === null) {
      return { isCustomAsset: false, asset: this.resolveDefaultFeeAsset(options) }
    }

    return {
      isCustomAsset: true,
      asset: findAssetInfoOrThrow(chain, { id: assetId }, null)
    }
  }

  async getDryRunCall(options: TDryRunCallBaseOptions<Extrinsic>): Promise<TDryRunChainResult> {
    const {
      tx,
      address,
      feeAsset,
      chain,
      destination,
      version,
      useRootOrigin = false,
      bypassOptions
    } = options
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, 'DryRunApi')
    }

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

    let resolvedFeeAsset = await this.resolveFeeAsset(options)

    const performDryRunCall = async (includeVersion: boolean) => {
      const versionNum = Number(version.charAt(1))
      return this.api.call.dryRunApi.dryRunCall(
        basePayload,
        resolvedTx,
        ...(includeVersion ? [versionNum] : [])
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

      const secondErrHuman = resultHuman?.Ok?.executionResult?.Err?.error
      if (secondErrHuman) {
        return { failureReason: String(secondErrHuman) }
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
        return { success: false, failureReason: msg, asset: resolvedFeeAsset.asset }
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
          asset: resolvedFeeAsset.asset
        }
      }
    }

    if (!isSuccess) {
      return {
        success: false,
        failureReason: failureErr.failureReason || 'Unknown error',
        failureSubReason: failureErr.failureSubReason,
        asset: resolvedFeeAsset.asset
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

    const destParaId =
      forwardedXcms.length === 0
        ? undefined
        : (i => (i.here === null ? 0 : (Array.isArray(i.x1) ? i.x1[0] : i.x1)?.parachain))(
            Object.values<any>(forwardedXcms[0])[0].interior
          )

    if (
      (hasXcmPaymentApiSupport(chain) &&
        resultJson.ok.local_xcm &&
        (feeAsset || (chain.startsWith('AssetHub') && destination === 'Ethereum'))) ||
      resolvedFeeAsset.isCustomAsset
    ) {
      const overriddenWeight = !resultJson.ok.local_xcm
        ? (await this.getPaymentInfo(tx, address)).weight
        : undefined

      const xcmFee = await this.getXcmPaymentApiFee(
        chain,
        resultJson.ok.local_xcm,
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
    const fee = computeFeeFromDryRunPjs(resultHuman, chain, executionFee)

    return {
      success: true,
      fee,
      asset: resolvedFeeAsset.asset,
      weight,
      forwardedXcms,
      destParaId
    }
  }

  async getXcmPaymentApiFee(
    chain: TSubstrateChain,
    localXcm: any,
    forwardedXcm: any,
    asset: TAssetInfo,
    version: Version,
    _transformXcm = false,
    overridenWeight?: TWeight
  ): Promise<bigint> {
    const weight = overridenWeight ?? (await this.getXcmWeight(localXcm))

    const assetLocalizedLoc = localizeLocation(chain, asset.location)

    const feeResult = await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight,
      addXcmVersionHeader(assetLocalizedLoc, version)
    )

    const execFeeRes = feeResult.toJSON() as any
    const execFeeOk = execFeeRes?.ok

    let execFee =
      typeof execFeeOk === 'string' || typeof execFeeOk === 'number' ? BigInt(execFeeOk) : 0n

    const isAssetNotFound = execFeeRes?.err === 'AssetNotFound'

    if (chain.startsWith('BridgeHub') && isAssetNotFound) {
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

  async getDeliveryFee(
    chain: TSubstrateChain,
    forwardedXcm: any[],
    asset: TAssetInfo,
    assetLocalizedLoc: TLocation,
    version: Version
  ): Promise<bigint> {
    let usedThirdParam = false
    let deliveryFeeRes: any

    if (forwardedXcm.length > 0) {
      const baseArgs = [forwardedXcm[0], forwardedXcm[1][0]] as const

      try {
        deliveryFeeRes = await this.api.call.xcmPaymentApi.queryDeliveryFees(...baseArgs)
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)

        if (message.includes('Expected 3 arguments')) {
          usedThirdParam = true
          const versionedAssetLoc = addXcmVersionHeader(assetLocalizedLoc, version)
          deliveryFeeRes = await this.api.call.xcmPaymentApi.queryDeliveryFees(
            ...baseArgs,
            versionedAssetLoc
          )
        } else {
          throw e
        }
      }
    }

    const deliveryFeeResJson = deliveryFeeRes?.toJSON()

    const deliveryFeeResolved =
      deliveryFeeRes && (deliveryFeeResJson.ok?.v4 ?? deliveryFeeResJson.ok?.v3)?.length > 0
        ? BigInt((deliveryFeeResJson?.ok?.v4 ?? deliveryFeeResJson?.ok?.v3)?.[0]?.fun?.fungible)
        : 0n

    const nativeAsset = findNativeAssetInfoOrThrow(chain)

    if (isAssetXcEqual(asset, nativeAsset) || usedThirdParam) {
      return deliveryFeeResolved
    }

    try {
      const res = await this.quoteAhPrice(
        localizeLocation(chain, nativeAsset.location),
        assetLocalizedLoc,
        deliveryFeeResolved,
        false
      )

      return res ?? 0n
    } catch (_e) {
      return 0n
    }
  }

  async getBridgeHubFallbackExecFee(
    chain: TSubstrateChain,
    weightValue: any,
    asset: TAssetInfo,
    version: Version
  ): Promise<bigint | undefined> {
    const fallbackExecFeeRes = await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
      weightValue,
      addXcmVersionHeader(RELAY_LOCATION, version)
    )

    const fallbackJson = fallbackExecFeeRes.toJSON() as any
    const fallbackOk = fallbackJson?.ok

    const fallbackExecFee =
      typeof fallbackOk === 'string' || typeof fallbackOk === 'number'
        ? BigInt(fallbackOk)
        : undefined

    if (fallbackExecFee === undefined) {
      return undefined
    }

    const ahApi = this.clone()
    const assetHubChain = `AssetHub${getRelayChainOf(chain)}` as TSubstrateChain

    await ahApi.init(assetHubChain)

    const ahLocalizedLoc = localizeLocation(assetHubChain, asset.location)

    const convertedExecFee = await ahApi.quoteAhPrice(
      RELAY_LOCATION,
      ahLocalizedLoc,
      fallbackExecFee,
      false
    )

    if (typeof convertedExecFee === 'bigint') {
      return convertedExecFee
    }

    return undefined
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
    version,
    origin
  }: TDryRunXcmBaseOptions<Extrinsic>): Promise<TDryRunChainResult> {
    const supportsDryRunApi = getAssetsObject(chain).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, 'DryRunApi')
    }

    const response = await this.api.call.dryRunApi.dryRunXcm(originLocation, xcm)

    const result = response.toHuman() as any
    const resultJson = response.toJSON() as any

    const isSuccess = result.Ok && result.Ok.executionResult.Complete

    if (!isSuccess) {
      const error = result.Ok.executionResult.Incomplete.error
      const failureReason = typeof error === 'string' ? error : error.error
      return { success: false, failureReason, asset }
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
        asset
      })
    }

    const feeAmount =
      feeEvent.section === 'assetConversion' ? feeEvent.data.amountIn : feeEvent.data.amount

    const fee = BigInt(feeAmount.replace(/,/g, ''))

    return { success: true, fee, asset, weight, forwardedXcms, destParaId }
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

  disconnect(force = false) {
    if (!this.initialized) return Promise.resolve()
    if (!force && !this.disconnectAllowed) return Promise.resolve()

    const api = isConfig(this._config) ? this._config.apiOverrides?.[this._chain] : this._config

    // Own client provided, destroy only if force true
    if (force && typeof api === 'object') {
      void this.api.disconnect()
    }

    // Client created automatically
    if (typeof api === 'string' || Array.isArray(api) || api === undefined) {
      if (force) {
        void this.api.disconnect()
      } else {
        const key = api === undefined ? getChainProviders(this._chain) : api
        releaseClient(key)
      }
    }

    return Promise.resolve()
  }

  validateSubstrateAddress(address: string): boolean {
    try {
      validateAddress(address)
      return true
    } catch {
      return false
    }
  }

  deriveAddress(sender: TSender<TPjsSigner>): string {
    if (isSenderSigner(sender)) return sender.address
    const { address } = createKeyringPair(sender)
    return address
  }

  async signAndSubmit(tx: Extrinsic, sender: TSender<TPjsSigner>): Promise<string> {
    const hash = isSenderSigner(sender)
      ? await tx.signAndSend(sender.address, { signer: sender.signer })
      : await tx.signAndSend(createKeyringPair(sender))

    return hash.toHex()
  }
}

export default PolkadotJsApi
