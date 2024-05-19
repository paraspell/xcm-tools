import { type ApiPromise } from '@polkadot/api'
import {
  type TMultiAsset,
  type TNodeWithRelayChains,
  type Extrinsic,
  type TAddress,
  type TSerializedApiCall,
  type TVersionClaimAssets
} from '../../types'
import { type TAssetClaimOptions } from '../../types/TAssetClaim'
import {
  type VersionBuilder,
  type AccountBuilder,
  type FinalBuilderAsync,
  type FungibleBuilder
} from './Builder'
import claimAssets from '../../pallets/assets/assetClaim'

class AssetClaimBuilder
  implements AccountBuilder, FungibleBuilder, VersionBuilder, FinalBuilderAsync
{
  private readonly api?: ApiPromise
  private readonly node: TNodeWithRelayChains

  private _multiAssets: TMultiAsset[]
  private _address: TAddress
  private _version?: TVersionClaimAssets

  private constructor(api: ApiPromise | undefined, node: TNodeWithRelayChains) {
    this.api = api
    this.node = node
  }

  static create(api: ApiPromise | undefined, node: TNodeWithRelayChains): FungibleBuilder {
    return new AssetClaimBuilder(api, node)
  }

  fungible(multiAssets: TMultiAsset[]): this {
    this._multiAssets = multiAssets
    return this
  }

  account(address: TAddress): this {
    this._address = address
    return this
  }

  xcmVersion(version: TVersionClaimAssets): this {
    this._version = version
    return this
  }

  private buildOptions(): TAssetClaimOptions {
    return {
      api: this.api,
      node: this.node,
      multiAssets: this._multiAssets,
      address: this._address,
      version: this._version
    }
  }

  async build(): Promise<Extrinsic> {
    const options = this.buildOptions()
    return (await claimAssets(options)) as Extrinsic
  }

  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return (await claimAssets({
      ...options,
      serializedApiCallEnabled: true
    })) as TSerializedApiCall
  }
}

export default AssetClaimBuilder
