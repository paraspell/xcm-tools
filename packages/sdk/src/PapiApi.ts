/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { blake2b } from '@noble/hashes/blake2b'
import { bytesToHex } from '@noble/hashes/utils'
import type {
  TAsset,
  TDryRunBaseOptions,
  TDryRunResult,
  TMultiLocation,
  TNodePolkadotKusama,
  TSerializedApiCall,
  TWeight
} from '@paraspell/sdk-core'
import { BatchMode, Parents, Version } from '@paraspell/sdk-core'
import {
  computeFeeFromDryRun,
  createApiInstanceForNode,
  getAssetsObject,
  getNode,
  type IPolkadotApi,
  isForeignAsset,
  NodeNotSupportedError,
  type TNodeDotKsmWithRelayChains,
  type TNodeWithRelayChains
} from '@paraspell/sdk-core'
import { AccountId, Binary, createClient, FixedSizeBinary } from 'polkadot-api'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'

import { transform } from './PapiXcmTransformer'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

const unsupportedNodes = [
  'ComposableFinance',
  'Interlay',
  'CrustShadow',
  'Kintsugi',
  'RobonomicsKusama',
  'Turing',
  'Pendulum',
  'Subsocial'
] as TNodeWithRelayChains[]

const isHex = (str: string) => {
  return typeof str === 'string' && /^0x[0-9a-fA-F]+$/.test(str)
}

class PapiApi implements IPolkadotApi<TPapiApi, TPapiTransaction> {
  private _api?: TPapiApiOrUrl
  private api: TPapiApi
  private initialized = false
  private disconnectAllowed = true

  setApi(api?: TPapiApiOrUrl) {
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

    if (unsupportedNodes.includes(node)) {
      throw new NodeNotSupportedError(`The node ${node} is not yet supported by the Polkadot API.`)
    }
    if (typeof this._api === 'string' || this._api instanceof Array) {
      this.api = await this.createApiInstance(this._api)
    } else {
      this.api =
        this._api ?? (await createApiInstanceForNode<TPapiApi, TPapiTransaction>(this, node))
    }

    this.initialized = true
  }

  async createApiInstance(wsUrl: string | string[]) {
    const isNodeJs = typeof window === 'undefined'
    let getWsProvider
    if (isNodeJs) {
      getWsProvider = (await import('polkadot-api/ws-provider/node')).getWsProvider
    } else {
      getWsProvider = (await import('polkadot-api/ws-provider/web')).getWsProvider
    }

    const provider = wsUrl instanceof Array ? getWsProvider(wsUrl) : getWsProvider(wsUrl)

    return Promise.resolve(createClient(withPolkadotSdkCompat(provider)))
  }

  accountToHex(address: string, isPrefixed = true) {
    if (isHex(address)) return address

    const hex = FixedSizeBinary.fromAccountId32<32>(address).asHex()
    return isPrefixed ? hex : hex.slice(2)
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCall) {
    const transformedParameters = transform(parameters)
    return this.api.getUnsafeApi().tx[module][section](transformedParameters)
  }

  callBatchMethod(calls: TPapiTransaction[], mode: BatchMode) {
    const section = mode === BatchMode.BATCH_ALL ? 'batch_all' : 'batch'
    return this.api
      .getUnsafeApi()
      .tx.Utility[section]({ calls: calls.map(call => call.decodedCall) })
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

  async calculateTransactionFee(tx: TPapiTransaction, address: string) {
    return tx.getEstimatedFees(address)
  }

  async quoteAhPrice(
    fromMl: TMultiLocation,
    toMl: TMultiLocation,
    amountIn: bigint,
    includeFee = true
  ) {
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

  async getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation) {
    const transformedMultiLocation = transform(multiLocation)

    const res = await this.api
      .getUnsafeApi()
      .query.ForeignAssets.Account.getValue(transformedMultiLocation, address)

    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getForeignAssetsByIdBalance(address: string, assetId: string) {
    const res = await this.api.getUnsafeApi().query.ForeignAssets.Account.getValue(assetId, address)

    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getBalanceForeignBifrost(address: string, asset: TAsset) {
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

  async getBalanceForeignXTokens(node: TNodePolkadotKusama, address: string, asset: TAsset) {
    let pallet = 'Tokens'

    if (node === 'Centrifuge' || node === 'Altair') {
      pallet = 'OrmlTokens'
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

  async getBalanceForeignAssetsAccount(address: string, assetId: bigint | number) {
    const response = await this.api.getUnsafeApi().query.Assets.Account.getValue(assetId, address)

    return BigInt(response === undefined ? 0 : response.balance)
  }

  async getFromRpc(module: string, method: string, key: string): Promise<string> {
    const toSS58 = AccountId().dec
    const value = await this.api._request(`${module}_${method}`, [
      module === 'system' && isHex(key) ? toSS58(key) : key
    ])
    return isHex(value) ? value : '0x' + value.toString(16).padStart(8, '0')
  }

  clone() {
    return new PapiApi()
  }

  async createApiForNode(node: TNodeDotKsmWithRelayChains) {
    const api = new PapiApi()
    await api.init(node)
    return api
  }

  async getDryRun({
    tx,
    address,
    node
  }: TDryRunBaseOptions<TPapiTransaction>): Promise<TDryRunResult> {
    const supportsDryRunApi = getAssetsObject(node).supportsDryRunApi

    if (!supportsDryRunApi) {
      throw new Error(`DryRunApi is not available on node ${node}`)
    }

    const result = await this.api.getUnsafeApi().apis.DryRunApi.dry_run_call(
      {
        type: 'system',
        value: {
          type: 'Signed',
          value: address
        }
      },
      tx.decodedCall
    )

    const isSuccess = result.success && result.value.execution_result.success
    if (!isSuccess) {
      const failureReason = result.value.execution_result.value.error.value.value.type
      return Promise.resolve({ success: false, failureReason })
    }

    const executionFee = await this.calculateTransactionFee(tx, address)
    const fee = computeFeeFromDryRun(result, node, executionFee)

    const actualWeight = result.value.execution_result.value.actual_weight

    const weight: TWeight | undefined = actualWeight
      ? { refTime: actualWeight.ref_time, proofSize: actualWeight.proof_size }
      : undefined

    return Promise.resolve({ success: true, fee, weight })
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

    // Disconnect api only if it was created automatically
    if (force || typeof this._api === 'string' || this._api === undefined) {
      this.api.destroy()
    }
    return Promise.resolve()
  }
}

export default PapiApi
