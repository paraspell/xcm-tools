/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type {
  HexString,
  TAsset,
  TMultiLocation,
  TNodeWithRelayChains,
  TSerializedApiCallV2
} from '../types'
import { createApiInstanceForNode } from '../utils'
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
  'Pioneer',
  'CrustShadow',
  'Kintsugi',
  'ParallelHeiko',
  'Picasso',
  'RobonomicsKusama',
  'Turing',
  'Pendulum',
  'Polkadex',
  'Subsocial'
] as TNodeWithRelayChains[]

class PapiApi implements IPolkadotApi<TPapiApi, TPapiTransaction> {
  private _api?: TPapiApiOrUrl
  private api: TPapiApi

  setApi(api?: TPapiApiOrUrl): void {
    this._api = api
  }

  getApi(): TPapiApi {
    return this.api
  }

  async init(node: TNodeWithRelayChains): Promise<void> {
    if (unsupportedNodes.includes(node)) {
      throw new NodeNotSupportedError(`The node ${node} is not yet supported by the Polkadot API.`)
    }
    if (typeof this._api === 'string') {
      this.api = await this.createApiInstance(this._api)
    } else {
      this.api =
        this._api ?? (await createApiInstanceForNode<TPapiApi, TPapiTransaction>(this, node))
    }
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

  createAccountId(address: string): HexString {
    return FixedSizeBinary.fromAccountId32<32>(address).asHex() as HexString
  }

  callTxMethod({ module, section, parameters }: TSerializedApiCallV2): TPapiTransaction {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const transformedParameters = transform(parameters)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.getUnsafeApi().tx[module][section](transformedParameters)
  }

  async calculateTransactionFee(tx: TPapiTransaction, address: string): Promise<bigint> {
    return tx.getEstimatedFees(address)
  }

  async getBalanceNative(address: string): Promise<bigint> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api.getUnsafeApi().query.System.Account.getValue(address)

    return res.data.free as bigint
  }

  async getBalanceForeignPolkadotXcm(address: string, id?: string): Promise<bigint> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api.getUnsafeApi().query.Assets.Account.getValue(id, address)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return res && res.balance ? BigInt(res.balance) : BigInt(0)
  }

  async getMythosForeignBalance(address: string): Promise<bigint> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api.getUnsafeApi().query.Balances.Account.getValue(address)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return res && res.free ? BigInt(res.free) : BigInt(0)
  }

  async getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation): Promise<bigint> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const transformedMultiLocation = transform(multiLocation)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api
      .getUnsafeApi()
      .query.ForeignAssets.Account.getValue(transformedMultiLocation, address)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return BigInt(res === undefined ? 0 : res.balance)
  }

  async getBalanceForeignXTokens(address: string, asset: TAsset): Promise<bigint> {
    const response = await this.api.getUnsafeApi().query.Tokens.Accounts.getEntries(address)

    const entry = response.find(({ keyArgs }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return entry?.value ? BigInt(entry.value.free.toString()) : BigInt(0)
  }

  async getBalanceForeignAssetsAccount(address: string, assetId: bigint | number): Promise<bigint> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = await this.api.getUnsafeApi().query.Assets.Account.getValue(assetId, address)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return BigInt(response === undefined ? 0 : response.balance)
  }

  async getFromStorage(key: string): Promise<string> {
    return await this.api._request('state_getStorage', [key])
  }

  clone(): IPolkadotApi<TPapiApi, TPapiTransaction> {
    return new PapiApi()
  }

  async createApiForNode(
    node: TNodeWithRelayChains
  ): Promise<IPolkadotApi<TPapiApi, TPapiTransaction>> {
    const api = new PapiApi()
    await api.init(node)
    return api
  }
}

export default PapiApi
