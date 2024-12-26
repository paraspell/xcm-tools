/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import type {
  TAsset,
  TDryRunBaseOptions,
  TDryRunResult,
  TMultiLocation,
  TNodePolkadotKusama,
  TSerializedApiCall
} from '@paraspell/sdk-core'
import {
  computeFeeFromDryRun,
  createApiInstanceForNode,
  getAssetsObject,
  getNode,
  isForeignAsset,
  NodeNotSupportedError,
  type IPolkadotApi,
  type TNodeDotKsmWithRelayChains,
  type TNodeWithRelayChains
} from '@paraspell/sdk-core'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'
import { createClient, FixedSizeBinary } from 'polkadot-api'
import { transform } from './PapiXcmTransformer'

const unsupportedNodes = [
  'ComposableFinance',
  'Interlay',
  'Parallel',
  'CrustShadow',
  'Kintsugi',
  'ParallelHeiko',
  'Picasso',
  'RobonomicsKusama',
  'Turing',
  'Pendulum',
  'Subsocial'
] as TNodeWithRelayChains[]

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

  createAccountId(address: string) {
    return FixedSizeBinary.fromAccountId32<32>(address).asHex()
  }

  accountToHex(address: string, isPrefixed = true) {
    const binary = FixedSizeBinary.fromAccountId32<32>(address)
    return binary.asHex().slice(isPrefixed ? 2 : 0)
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCall) {
    const transformedParameters = transform(parameters)

    return this.api.getUnsafeApi().tx[module][section](transformedParameters)
  }

  async calculateTransactionFee(tx: TPapiTransaction, address: string) {
    return tx.getEstimatedFees(address)
  }

  async getBalanceNative(address: string) {
    const res = await this.api.getUnsafeApi().query.System.Account.getValue(address)

    return res.data.free as bigint
  }

  async getBalanceForeignPolkadotXcm(address: string, id?: string) {
    const res = await this.api.getUnsafeApi().query.Assets.Account.getValue(id, address)

    return res && res.balance ? BigInt(res.balance) : BigInt(0)
  }

  async getMythosForeignBalance(address: string) {
    const res = await this.api.getUnsafeApi().query.Balances.Account.getValue(address)

    return res && res.free ? BigInt(res.free) : BigInt(0)
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
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceNativeAcala(address: string, symbol: string) {
    const transformedParameters = transform({ Token: symbol })

    const response = await this.api
      .getUnsafeApi()
      .query.Tokens.Accounts.getValue(address, transformedParameters)

    const accountData = response ? response : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
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

    return entry?.value ? BigInt(entry.value.free.toString()) : BigInt(0)
  }

  async getBalanceForeignAssetsAccount(address: string, assetId: bigint | number) {
    const response = await this.api.getUnsafeApi().query.Assets.Account.getValue(assetId, address)

    return BigInt(response === undefined ? 0 : response.balance)
  }

  async getFromStorage(key: string): Promise<string> {
    return this.api._request('state_getStorage', [key])
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

    return Promise.resolve({ success: true, fee })
  }

  setDisconnectAllowed(allowed: boolean) {
    this.disconnectAllowed = allowed
  }

  getDisconnectAllowed() {
    return this.disconnectAllowed
  }

  disconnect() {
    if (!this.disconnectAllowed) return Promise.resolve()

    // Disconnect api only if it was created automatically
    if (typeof this._api === 'string' || this._api === undefined) {
      this.api.destroy()
    }
    return Promise.resolve()
  }
}

export default PapiApi
