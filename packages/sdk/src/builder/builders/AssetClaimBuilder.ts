import type { TApiType, TResType } from '../../types'
import {
  type TMultiAsset,
  type TNodeWithRelayChains,
  type TAddress,
  type TSerializedApiCall,
  type TVersionClaimAssets
} from '../../types'
import { type TAssetClaimOptions } from '../../types/TAssetClaim'
import {
  type VersionBuilder,
  type AccountBuilder,
  type FinalBuilder,
  type FungibleBuilder
} from './Builder'
import claimAssets from '../../pallets/assets/asset-claim'

/**
 * Builder class for constructing asset claim transactions.
 */
class AssetClaimBuilder<TApi extends TApiType, TRes extends TResType>
  implements AccountBuilder<TRes>, FungibleBuilder<TRes>, VersionBuilder<TRes>, FinalBuilder<TRes>
{
  private readonly api?: TApi
  private readonly node: TNodeWithRelayChains

  private _multiAssets: TMultiAsset[]
  private _address: TAddress
  private _version?: TVersionClaimAssets

  private constructor(api: TApi | undefined, node: TNodeWithRelayChains) {
    this.api = api
    this.node = node
  }

  static create<TApi extends TApiType, TRes extends TResType>(
    api: TApi | undefined,
    node: TNodeWithRelayChains
  ): FungibleBuilder<TRes> {
    return new AssetClaimBuilder(api, node)
  }

  /**
   * Specifies the assets to be claimed.
   *
   * @param multiAssets - An array of assets to claim in a multi-asset format.
   * @returns An instance of Builder
   */
  fungible(multiAssets: TMultiAsset[]): this {
    this._multiAssets = multiAssets
    return this
  }

  /**
   * Specifies the account address on which the assets will be claimed.
   *
   * @param address - The destination account address.
   * @returns An instance of Builder
   */
  account(address: TAddress): this {
    this._address = address
    return this
  }

  /**
   * Sets the XCM version to be used for the asset claim.
   *
   * @param version - The XCM version.
   * @returns An instance of Builder
   */
  xcmVersion(version: TVersionClaimAssets): this {
    this._version = version
    return this
  }

  private buildOptions(): TAssetClaimOptions<TApi> {
    return {
      api: this.api,
      node: this.node,
      multiAssets: this._multiAssets,
      address: this._address,
      version: this._version
    }
  }

  /**
   * Builds and returns the asset claim extrinsic.
   *
   * @returns A Promise that resolves to the asset claim extrinsic.
   */
  async build() {
    const options = this.buildOptions()
    return (await claimAssets(options)) as TRes
  }

  /**
   * Builds and returns a serialized API call for the asset claim.
   *
   * @returns A Promise that resolves to the serialized API call.
   */
  async buildSerializedApiCall(): Promise<TSerializedApiCall> {
    const options = this.buildOptions()
    return (await claimAssets({
      ...options,
      serializedApiCallEnabled: true
    })) as TSerializedApiCall
  }
}

export default AssetClaimBuilder
