import type {
  HexString,
  TAsset,
  TMultiLocation,
  TNodeWithRelayChains,
  TSerializedApiCallV2
} from '../types'
import { createApiInstanceForNode } from '../utils'
import { createClient, FixedSizeBinary, type PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from '../papi/types'
import type { IPolkadotApi } from '../api'
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat'
import { transform } from './PapiXcmTransformer'
import { NodeNotSupportedError } from '../errors'

const unsupportedNodes = [
  'ComposableFinance',
  'Interlay',
  'Parallel',
  'Pioneer',
  'CrustShadow',
  'Kintsugi',
  'ParallelHeiko',
  'Picasso',
  'Robonomics',
  'Turing',
  'Pendulum',
  'Polkadex',
  'Subsocial',
  'Litmus'
] as TNodeWithRelayChains[]

class PapiApi implements IPolkadotApi<PolkadotClient, TPapiTransaction> {
  private _api?: PolkadotClient
  private api: PolkadotClient

  setApi(api?: PolkadotClient): void {
    this._api = api
  }

  getApi(): PolkadotClient {
    return this.api
  }

  async init(node: TNodeWithRelayChains): Promise<void> {
    if (unsupportedNodes.includes(node)) {
      throw new NodeNotSupportedError(`The node ${node} is not yet supported by the Polkadot API.`)
    }
    this.api =
      this._api ?? (await createApiInstanceForNode<PolkadotClient, TPapiTransaction>(this, node))
  }

  async createApiInstance(wsUrl: string): Promise<PolkadotClient> {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return res.data.free as bigint
  }

  async getBalanceForeign(address: string, id?: string): Promise<bigint | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api.getUnsafeApi().query.Assets.Account.getValue(address, id)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return res.balance ? BigInt(res.balance) : null
  }

  async getMythosForeignBalance(address: string): Promise<bigint | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api.getUnsafeApi().query.Balances.Account.getValue(address)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return res.free ? BigInt(res.free) : null
  }

  async getAssetHubForeignBalance(
    address: string,
    multiLocation: TMultiLocation
  ): Promise<bigint | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await this.api
      .getUnsafeApi()
      .query.ForeignAssets.Account.getValue(multiLocation, address)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return BigInt(res === null || !res.balance ? 0 : res.balance)
  }

  async getBalanceForeignXTokens(address: string, asset: TAsset): Promise<bigint | null> {
    const response = await this.api.getUnsafeApi().query.Tokens.Accounts.getEntries(address)

    const entry = response.find(({ keyArgs }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [_address, assetItem] = keyArgs

      return (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        assetItem.toString().toLowerCase() === asset.symbol?.toLowerCase() ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        assetItem.toString().toLowerCase() === asset.assetId?.toLowerCase() ||
        (typeof assetItem === 'object' &&
          'value' in assetItem && // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          assetItem.value.toString().toLowerCase() === asset.symbol?.toLowerCase()) ||
        (typeof assetItem === 'object' &&
          'value' in assetItem &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          assetItem.value.toString().toLowerCase() === asset.assetId?.toLowerCase())
      )
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return entry?.value ? BigInt(entry.value.free.toString()) : null
  }

  clone(): IPolkadotApi<PolkadotClient, TPapiTransaction> {
    return new PapiApi()
  }
}

export default PapiApi
