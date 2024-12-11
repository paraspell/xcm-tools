/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type {
  THexString,
  TAsset,
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
  TSerializedApiCall,
  TNodePolkadotKusama
} from '../types'
import { createApiInstanceForNode, getNode } from '../utils'
import { createClient, FixedSizeBinary } from 'polkadot-api'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from '../papi/types'
import type { IPolkadotApi } from '../api'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'
import { transform } from './PapiXcmTransformer'
import { NodeNotSupportedError } from '../errors'
import { isForeignAsset } from '../utils/assets'

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

  setApi(api?: TPapiApiOrUrl): void {
    this._api = api
  }

  getApiOrUrl(): TPapiApiOrUrl | undefined {
    return this._api
  }

  getApi(): TPapiApi {
    return this.api
  }

  async init(node: TNodeDotKsmWithRelayChains): Promise<void> {
    if (this.initialized) {
      return
    }

    if (unsupportedNodes.includes(node)) {
      throw new NodeNotSupportedError(`The node ${node} is not yet supported by the Polkadot API.`)
    }
    if (typeof this._api === 'string') {
      this.api = await this.createApiInstance(this._api)
    } else {
      this.api =
        this._api ?? (await createApiInstanceForNode<TPapiApi, TPapiTransaction>(this, node))
    }

    this.initialized = true
  }

  async createApiInstance(wsUrl: string): Promise<TPapiApi> {
    const isNodeJs = typeof window === 'undefined'
    let getWsProvider
    if (isNodeJs) {
      getWsProvider = (await import('polkadot-api/ws-provider/node')).getWsProvider
    } else {
      getWsProvider = (await import('polkadot-api/ws-provider/web')).getWsProvider
    }
    return Promise.resolve(createClient(withPolkadotSdkCompat(getWsProvider(wsUrl))))
  }

  createAccountId(address: string): THexString {
    return FixedSizeBinary.fromAccountId32<32>(address).asHex() as THexString
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCall): TPapiTransaction {
    const transformedParameters = transform(parameters)

    return this.api.getUnsafeApi().tx[module][section](transformedParameters)
  }

  async calculateTransactionFee(tx: TPapiTransaction, address: string): Promise<bigint> {
    return tx.getEstimatedFees(address)
  }

  async getBalanceNative(address: string): Promise<bigint> {
    const res = await this.api.getUnsafeApi().query.System.Account.getValue(address)

    return res.data.free as bigint
  }

  async getBalanceForeignPolkadotXcm(address: string, id?: string): Promise<bigint> {
    const res = await this.api.getUnsafeApi().query.Assets.Account.getValue(id, address)

    return res && res.balance ? BigInt(res.balance) : BigInt(0)
  }

  async getMythosForeignBalance(address: string): Promise<bigint> {
    const res = await this.api.getUnsafeApi().query.Balances.Account.getValue(address)

    return res && res.free ? BigInt(res.free) : BigInt(0)
  }

  async getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation): Promise<bigint> {
    const transformedMultiLocation = transform(multiLocation)

    const res = await this.api
      .getUnsafeApi()
      .query.ForeignAssets.Account.getValue(transformedMultiLocation, address)

    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getForeignAssetsByIdBalance(address: string, assetId: string): Promise<bigint> {
    const res = await this.api.getUnsafeApi().query.ForeignAssets.Account.getValue(assetId, address)

    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getBalanceForeignBifrost(address: string, asset: TAsset): Promise<bigint> {
    const currencySelection = getNode('BifrostPolkadot').getCurrencySelection(asset)

    const transformedParameters = transform(currencySelection)

    const response = await this.api
      .getUnsafeApi()
      .query.Tokens.Accounts.getValue(address, transformedParameters)

    const accountData = response ? response : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceNativeAcala(address: string, symbol: string): Promise<bigint> {
    const transformedParameters = transform({ Token: symbol })

    const response = await this.api
      .getUnsafeApi()
      .query.Tokens.Accounts.getValue(address, transformedParameters)

    const accountData = response ? response : null
    return accountData ? BigInt(accountData.free.toString()) : BigInt(0)
  }

  async getBalanceForeignXTokens(
    node: TNodePolkadotKusama,
    address: string,
    asset: TAsset
  ): Promise<bigint> {
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

  async getBalanceForeignAssetsAccount(address: string, assetId: bigint | number): Promise<bigint> {
    const response = await this.api.getUnsafeApi().query.Assets.Account.getValue(assetId, address)

    return BigInt(response === undefined ? 0 : response.balance)
  }

  async getFromStorage(key: string): Promise<string> {
    return this.api._request('state_getStorage', [key])
  }

  clone(): IPolkadotApi<TPapiApi, TPapiTransaction> {
    return new PapiApi()
  }

  async createApiForNode(
    node: TNodeDotKsmWithRelayChains
  ): Promise<IPolkadotApi<TPapiApi, TPapiTransaction>> {
    const api = new PapiApi()
    await api.init(node)
    return api
  }

  setDisconnectAllowed(allowed: boolean): void {
    this.disconnectAllowed = allowed
  }

  getDisconnectAllowed(): boolean {
    return this.disconnectAllowed
  }

  disconnect(): Promise<void> {
    if (!this.disconnectAllowed) return Promise.resolve()

    // Disconnect api only if it was created automatically
    if (typeof this._api === 'string' || this._api === undefined) {
      this.api.destroy()
    }
    return Promise.resolve()
  }
}

export default PapiApi
