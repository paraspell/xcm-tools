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
  TDryRunXcmBaseOptions,
  TLocation,
  TPallet,
  TSerializedApiCall,
  TSubstrateChain,
  TWeight
} from '@paraspell/sdk-core'
import {
  assertHasId,
  assertHasLocation,
  BatchMode,
  ChainNotSupportedError,
  computeFeeFromDryRun,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getAssetsObject,
  getChain,
  getChainProviders,
  hasXcmPaymentApiSupport,
  InvalidParameterError,
  isAssetEqual,
  isAssetXcEqual,
  isConfig,
  isForeignAsset,
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
  return createClient(withPolkadotSdkCompat(provider))
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
      throw new InvalidParameterError(`Invalid address: ${address}`)
    }

    return result.publicKey
  }

  callTxMethod({ module, method, parameters }: TSerializedApiCall) {
    const transformedParameters = transform(parameters)
    return this.api.getUnsafeApi().tx[module][method](transformedParameters)
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

  async getBalanceNative(address: string) {
    const res = await this.api.getUnsafeApi().query.System.Account.getValue(address)

    return res.data.free as bigint
  }

  async getBalanceForeignPolkadotXcm(chain: TSubstrateChain, address: string, asset: TAssetInfo) {
    if (chain.startsWith('Kilt')) {
      assertHasLocation(asset)
      const res = await this.api
        .getUnsafeApi()
        .query.Fungibles.Account.getValue(transform(asset.location), address)

      return res && res.balance ? BigInt(res.balance) : 0n
    }

    assertHasId(asset)

    const res = await this.api
      .getUnsafeApi()
      .query.Assets.Account.getValue(
        chain === 'NeuroWeb' ? BigInt(asset.assetId) : asset.assetId,
        address
      )

    return res && res.balance ? BigInt(res.balance) : 0n
  }

  async getMythosForeignBalance(address: string) {
    const res = await this.api.getUnsafeApi().query.Balances.Account.getValue(address)

    return res && res.free ? BigInt(res.free) : 0n
  }

  async getBalanceForeignAssetsPallet(address: string, location: TLocation) {
    const transformedLocation = transform(location)

    const res = await this.api
      .getUnsafeApi()
      .query.ForeignAssets.Account.getValue(transformedLocation, address)

    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getForeignAssetsByIdBalance(address: string, assetId: string) {
    const res = await this.api.getUnsafeApi().query.ForeignAssets.Account.getValue(assetId, address)

    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getBalanceForeignBifrost(address: string, asset: TAssetInfo) {
    const currencySelection = getChain('BifrostPolkadot').getCurrencySelection(asset)

    const transformedParameters = transform(currencySelection)

    const response = await this.api
      .getUnsafeApi()
      .query.Tokens.Accounts.getValue(address, transformedParameters)

    const accountData = response ? response : null
    return accountData ? BigInt(accountData.free.toString()) : 0n
  }

  async getBalanceNativeAcala(address: string, symbol: string) {
    const transformedParameters = transform({ Token: symbol })

    const response = await this.api
      .getUnsafeApi()
      .query.Tokens.Accounts.getValue(address, transformedParameters)

    const accountData = response ? response : null
    return accountData ? BigInt(accountData.free.toString()) : 0n
  }

  async getBalanceForeignXTokens(chain: TSubstrateChain, address: string, asset: TAssetInfo) {
    let pallet = 'Tokens'

    if (chain === 'Centrifuge' || chain === 'Altair') {
      pallet = 'OrmlTokens'
    }

    if (chain === 'Peaq' || chain === 'Manta' || chain === 'Crust' || chain === 'Ajuna') {
      assertHasId(asset)
      const response = await this.api
        .getUnsafeApi()
        .query.Assets.Account.getValue(
          chain === 'Manta' || chain === 'Crust' ? BigInt(asset.assetId) : asset.assetId,
          address
        )
      return response ? BigInt(response.free.toString()) : 0n
    }

    if (chain === 'Unique') {
      assertHasLocation(asset)
      assertHasId(asset)
      const unsafeApi = this.api.getUnsafeApi()

      const collectionId = await unsafeApi.query.ForeignAssets.ForeignAssetToCollection.getValue(
        transform(asset.location)
      )

      const balance = await unsafeApi.apis.UniqueApi.balance(
        collectionId,
        { type: 'Substrate', value: address },
        asset.assetId
      )

      return balance.success ? BigInt(balance.value) : 0n
    }

    if (chain === 'Hydration') {
      assertHasId(asset)
      const response = await this.api
        .getUnsafeApi()
        .apis.CurrenciesApi.account(asset.assetId, address)
      return response ? BigInt(response.free.toString()) : 0n
    }

    const response = await this.api.getUnsafeApi().query[pallet].Accounts.getEntries(address)

    const entry = response.find(({ keyArgs }) => {
      const [_address, assetItem] = keyArgs

      return (
        assetItem.toString().toLowerCase() === asset.symbol?.toLowerCase() ||
        (isForeignAsset(asset) &&
          assetItem.toString().toLowerCase() === asset.assetId?.toLowerCase()) ||
        (typeof assetItem === 'object' &&
          'value' in assetItem &&
          assetItem.value.toString().toLowerCase() === asset.symbol?.toLowerCase()) ||
        (typeof assetItem === 'object' &&
          'value' in assetItem &&
          isForeignAsset(asset) &&
          assetItem.value.toString().toLowerCase() === asset.assetId?.toLowerCase())
      )
    })

    return entry?.value ? BigInt(entry.value.free.toString()) : 0n
  }

  async getBalanceAssetsPallet(address: string, assetId: bigint | number) {
    const response = await this.api.getUnsafeApi().query.Assets.Account.getValue(assetId, address)

    return BigInt(response === undefined ? 0 : response.balance)
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

  resolveDefaultUsedAsset({ chain, feeAsset }: TDryRunCallBaseOptions<TPapiTransaction>) {
    return feeAsset ?? findNativeAssetInfoOrThrow(chain)
  }

  async resolveUsedAsset(options: TDryRunCallBaseOptions<TPapiTransaction>) {
    const { chain, address } = options
    if (!chain.startsWith('Hydration'))
      return { isCustomAsset: false, asset: this.resolveDefaultUsedAsset(options) }

    const assetId = await this.api
      .getUnsafeApi()
      .query.MultiTransactionPayment.AccountCurrencyMap.getValue(address)

    if (assetId === undefined)
      return { isCustomAsset: false, asset: findNativeAssetInfoOrThrow(chain) }

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

    const extractFailureReasonFromResult = (result: any): string => {
      const executionResultValue = result?.value?.execution_result?.value

      if (executionResultValue?.error?.value?.value?.type) {
        return String(executionResultValue.error.value.value.type)
      }

      if (executionResultValue?.error?.value?.type) {
        return String(executionResultValue.error.value.type)
      }

      if (result?.value?.type) {
        return String(result.value.type)
      }

      const erroredEvent = findFailingEvent(result)

      if (erroredEvent) {
        const result = erroredEvent.value.value.result
        return result.value.value.value?.type ?? result.value.value.type
      }

      return JSON.stringify(result?.value ?? result ?? 'Unknown error structure', replaceBigInt)
    }

    let result
    let isSuccess
    let failureOutputReason = ''

    result = await performDryRunCall(false)

    isSuccess = getExecutionSuccessFromResult(result)

    if (!isSuccess) {
      const initialFailureReason = extractFailureReasonFromResult(result)
      failureOutputReason = initialFailureReason

      if (initialFailureReason === 'VersionedConversionFailed') {
        result = await performDryRunCall(true)
        isSuccess = getExecutionSuccessFromResult(result)

        if (!isSuccess) {
          failureOutputReason = extractFailureReasonFromResult(result)
        } else {
          failureOutputReason = ''
        }
      }
    }

    const resolvedUsed = await this.resolveUsedAsset(options)
    let usedAsset = resolvedUsed.asset
    let usedSymbol = usedAsset.symbol

    if (!isSuccess) {
      return Promise.resolve({
        success: false,
        failureReason: failureOutputReason,
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

    const hasLocation = usedAsset?.location

    if (
      (hasXcmPaymentApiSupport(chain) &&
        result.value.local_xcm &&
        hasLocation &&
        (feeAsset || (chain.startsWith('AssetHub') && destination === 'Ethereum'))) ||
      resolvedUsed.isCustomAsset
    ) {
      const xcmFee = await this.getXcmPaymentApiFee(
        chain,
        result.value.local_xcm,
        forwardedXcms,
        usedAsset
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
      } else {
        usedAsset = this.resolveDefaultUsedAsset(options)
        usedSymbol = usedAsset.symbol
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

  async convertLocationToAccount(location: TLocation): Promise<string | undefined> {
    const res = await this.api
      .getUnsafeApi()
      .apis.LocationToAccountApi.convert_location({ type: Version.V4, value: transform(location) })

    return res.success ? res.value : undefined
  }
}

export default PapiApi
