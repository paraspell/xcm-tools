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
  TDryRunCallBaseOptions,
  TDryRunNodeResultInternal,
  TDryRunXcmBaseOptions,
  TLocation,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
  TSerializedApiCall,
  TWeight
} from '@paraspell/sdk-core'
import {
  assertHasId,
  assertHasLocation,
  BatchMode,
  computeFeeFromDryRun,
  createApiInstanceForNode,
  findAssetInfo,
  getAssetsObject,
  getNativeAssetSymbol,
  getNode,
  getNodeProviders,
  hasXcmPaymentApiSupport,
  InvalidParameterError,
  isAssetEqual,
  isConfig,
  isForeignAsset,
  isRelayChain,
  localizeLocation,
  MissingChainApiError,
  Native,
  NodeNotSupportedError,
  padFeeBy,
  Parents,
  Version
} from '@paraspell/sdk-core'
import { AccountId, Binary, createClient, FixedSizeBinary, getSs58AddressInfo } from 'polkadot-api'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'
import { isAddress } from 'viem'

import { processAssetsDepositedEvents } from './fee'
import { transform } from './PapiXcmTransformer'
import { createClientCache, type TClientKey } from './TimedCache'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

const DEFAULT_TTL_MS = 60_000 // 1 minute
const MAX_CLIENTS = 100
const EXTENSION_MS = 5 * 60_000 // 5 minutes

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

const createPolkadotClient = async (ws: string | string[]): Promise<TPapiApi> => {
  const isNodeJs = typeof window === 'undefined'

  const { getWsProvider } = isNodeJs
    ? await import('polkadot-api/ws-provider/node')
    : await import('polkadot-api/ws-provider/web')

  const provider = Array.isArray(ws) ? getWsProvider(ws) : getWsProvider(ws)
  return createClient(withPolkadotSdkCompat(provider))
}

const leasePolkadotClient = async (ws: string | string[], ttlMs: number) => {
  const key = keyFromWs(ws)
  let entry = clientPool.peek(key)

  if (!entry) {
    entry = { client: await createPolkadotClient(ws), refs: 0, destroyWanted: false }
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

const unsupportedNodes: TNodeWithRelayChains[] = [
  'ComposableFinance',
  'Interlay',
  'CrustShadow',
  'Kintsugi',
  'RobonomicsKusama',
  'Pendulum',
  'Subsocial'
]

const isHex = (str: string) => {
  return typeof str === 'string' && /^0x[0-9a-fA-F]+$/.test(str)
}

class PapiApi implements IPolkadotApi<TPapiApi, TPapiTransaction> {
  private _config?: TBuilderOptions<TPapiApiOrUrl>
  private api: TPapiApi
  private _ttlMs = DEFAULT_TTL_MS
  private initialized = false
  private disconnectAllowed = true
  private _node: TNodeDotKsmWithRelayChains

  constructor(config?: TBuilderOptions<TPapiApiOrUrl>) {
    this._config = config
  }

  getConfig() {
    return this._config
  }

  getApi() {
    return this.api
  }

  async init(chain: TNodeWithRelayChains, clientTtlMs: number = DEFAULT_TTL_MS) {
    if (this.initialized || chain === 'Ethereum') {
      return
    }

    if (unsupportedNodes.includes(chain)) {
      throw new NodeNotSupportedError(`The node ${chain} is not yet supported by the Polkadot API.`)
    }

    this._ttlMs = clientTtlMs
    this._node = chain

    const apiConfig = this.getApiConfigForChain(chain)

    // For development mode, api for each used chain must be provided
    if (isConfig(this._config) && this._config.development && !apiConfig) {
      throw new MissingChainApiError(chain)
    }

    this.api = await this.resolveApi(apiConfig, chain)

    this.initialized = true
  }

  private getApiConfigForChain(chain: TNodeWithRelayChains): TPapiApiOrUrl | undefined {
    if (isConfig(this._config)) {
      return this._config.apiOverrides?.[chain]
    }
    return this._config
  }

  private async resolveApi(
    apiConfig: TPapiApiOrUrl | undefined,
    chain: TNodeDotKsmWithRelayChains
  ): Promise<TPapiApi> {
    if (!apiConfig) {
      return createApiInstanceForNode<TPapiApi, TPapiTransaction>(this, chain)
    }

    if (typeof apiConfig === 'string' || apiConfig instanceof Array) {
      return this.createApiInstance(apiConfig)
    }

    return apiConfig
  }

  async createApiInstance(wsUrl: string | string[]) {
    return leasePolkadotClient(wsUrl, this._ttlMs)
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

  getMethod(tx: TPapiTransaction) {
    return tx.decodedCall.value.value
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

  async getBalanceNative(address: string) {
    const res = await this.api.getUnsafeApi().query.System.Account.getValue(address)

    return res.data.free as bigint
  }

  async getBalanceForeignPolkadotXcm(address: string, id?: string) {
    const res = await this.api.getUnsafeApi().query.Assets.Account.getValue(id, address)

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
    const currencySelection = getNode('BifrostPolkadot').getCurrencySelection(asset)

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

  async getBalanceForeignXTokens(node: TNodePolkadotKusama, address: string, asset: TAssetInfo) {
    let pallet = 'Tokens'

    if (node === 'Centrifuge' || node === 'Altair') {
      pallet = 'OrmlTokens'
    }

    if (node === 'Hydration') {
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

  async createApiForNode(node: TNodeDotKsmWithRelayChains) {
    const api = new PapiApi()
    await api.init(node)
    return api
  }

  async getDryRunCall({
    tx,
    address,
    node,
    feeAsset
  }: TDryRunCallBaseOptions<TPapiTransaction>): Promise<TDryRunNodeResultInternal> {
    const supportsDryRunApi = getAssetsObject(node).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new NodeNotSupportedError(`DryRunApi is not available on node ${node}`)
    }

    const DEFAULT_XCM_VERSION = 3

    const basePayload = {
      type: 'system',
      value: {
        type: 'Signed',
        value: address
      }
    }

    const performDryRunCall = async (includeVersion: boolean): Promise<any> => {
      const callArgs: any[] = [basePayload, tx.decodedCall]
      if (includeVersion) {
        callArgs.push(DEFAULT_XCM_VERSION)
      }
      return this.api.getUnsafeApi().apis.DryRunApi.dry_run_call(...callArgs)
    }

    const getExecutionSuccessFromResult = (result: any): boolean => {
      return result?.success && result.value?.execution_result?.success
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
      return JSON.stringify(result?.value ?? result ?? 'Unknown error structure')
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

    if (!isSuccess) {
      return Promise.resolve({ success: false, failureReason: failureOutputReason })
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

    const executionFee = await this.calculateTransactionFee(tx, address)

    const nativeAsset = findAssetInfo(node, { symbol: Native(getNativeAssetSymbol(node)) }, null)

    const hasLocation = feeAsset ? Boolean(feeAsset.location) : Boolean(nativeAsset?.location)

    if (
      hasXcmPaymentApiSupport(node) &&
      result.value.local_xcm &&
      hasLocation &&
      nativeAsset &&
      node !== 'AssetHubPolkadot' &&
      node !== 'Kusama'
    ) {
      const xcmFee = await this.getXcmPaymentApiFee(
        node,
        result.value.local_xcm,
        feeAsset ?? nativeAsset
      )

      if (typeof xcmFee === 'bigint') {
        return Promise.resolve({
          success: true,
          fee: xcmFee,
          weight,
          forwardedXcms,
          destParaId
        })
      }
    }

    const fee = computeFeeFromDryRun(result, node, executionFee, !!feeAsset)

    return Promise.resolve({
      success: true,
      fee,
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
    node: TNodeDotKsmWithRelayChains,
    xcm: any,
    asset: TAssetInfo,
    transformXcm = false
  ): Promise<bigint> {
    const weight = await this.api
      .getUnsafeApi()
      .apis.XcmPaymentApi.query_xcm_weight(transformXcm ? transform(xcm) : xcm)

    assertHasLocation(asset)

    const localizedLocation =
      node === 'AssetHubPolkadot' || node === 'AssetHubKusama' || isRelayChain(node)
        ? localizeLocation(node, asset.location)
        : asset.location

    const transformedLocation = transform(localizedLocation)

    const feeResult = await this.api
      .getUnsafeApi()
      .apis.XcmPaymentApi.query_weight_to_asset_fee(weight.value, {
        type: Version.V4,
        value: transformedLocation
      })

    return feeResult.value
  }

  async getDryRunXcm({
    originLocation,
    xcm,
    node,
    origin,
    asset,
    feeAsset,
    originFee,
    amount
  }: TDryRunXcmBaseOptions): Promise<TDryRunNodeResultInternal> {
    const supportsDryRunApi = getAssetsObject(node).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new NodeNotSupportedError(`DryRunApi is not available on node ${node}`)
    }

    const transformedOriginLocation = transform(originLocation)

    const result = await this.api
      .getUnsafeApi()
      .apis.DryRunApi.dry_run_xcm(transformedOriginLocation, xcm)

    const isSuccess = result.success && result.value.execution_result.type === 'Complete'
    if (!isSuccess) {
      const failureReason = result.value.execution_result.value.error.type
      return Promise.resolve({ success: false, failureReason })
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

    if (
      hasXcmPaymentApiSupport(node) &&
      asset &&
      node !== 'AssetHubPolkadot' &&
      node !== 'Polkadot'
    ) {
      const fee = await this.getXcmPaymentApiFee(node, xcm, asset)

      if (typeof fee === 'bigint') {
        return {
          success: true,
          fee,
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
      node === 'AssetHubPolkadot' && asset?.symbol !== 'DOT'
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
      (node === 'Mythos'
        ? reversedEvents.find(event => event.type === 'Balances' && event.value.type === 'Issued')
        : undefined) ??
      //
      (origin === 'Mythos' || (node === 'AssetHubPolkadot' && asset?.symbol !== 'DOT')
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
        failureReason: 'Cannot determine destination fee. No fee event found'
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
      (isRelayChain(node) || node.includes('AssetHub')) && asset?.symbol === 'DOT'
        ? padFeeBy(fee, 30)
        : fee

    return Promise.resolve({
      success: true,
      fee: processedFee,
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

    const api = isConfig(this._config) ? this._config.apiOverrides?.[this._node] : this._config

    // Own client provided, destroy only if force true
    if (force && typeof api === 'object') {
      this.api.destroy()
    }

    // Client created automatically
    if (typeof api === 'string' || Array.isArray(api) || api === undefined) {
      if (force) {
        this.api.destroy()
      } else {
        const key = api === undefined ? getNodeProviders(this._node) : api
        releasePolkadotClient(key)
      }
    }

    return Promise.resolve()
  }
}

export default PapiApi
