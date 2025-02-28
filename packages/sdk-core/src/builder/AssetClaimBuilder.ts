import type { IAccountBuilder, IFinalBuilder, IFungibleBuilder, IVersionBuilder } from '../types'
import {
  type TMultiAsset,
  type TNodeWithRelayChains,
  type TAddress,
  type TVersionClaimAssets
} from '../types'
import { type TAssetClaimOptions } from '../types/TAssetClaim'
import { claimAssets } from '../pallets/assets/asset-claim'
import type { IPolkadotApi } from '../api/IPolkadotApi'

/**
 * Builder class for constructing asset claim transactions.
 */
class AssetClaimBuilder<TApi, TRes>
  implements
    IAccountBuilder<TApi, TRes>,
    IFungibleBuilder<TApi, TRes>,
    IVersionBuilder<TApi, TRes>,
    IFinalBuilder<TApi, TRes>
{
  private readonly api: IPolkadotApi<TApi, TRes>
  private readonly node: TNodeWithRelayChains

  private _multiAssets: TMultiAsset[]
  private _address: TAddress
  private _version?: TVersionClaimAssets

  private constructor(api: IPolkadotApi<TApi, TRes>, node: TNodeWithRelayChains) {
    this.api = api
    this.node = node
  }

  static create<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    node: TNodeWithRelayChains
  ): IFungibleBuilder<TApi, TRes> {
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

  private buildOptions(): TAssetClaimOptions<TApi, TRes> {
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
   * Returns the API instance used by the builder.
   *
   * @returns The API instance.
   */
  getApi() {
    return this.api.getApi()
  }

  /**
   * Disconnects the API.
   *
   * @returns A Promise that resolves when the API is disconnected.
   */
  async disconnect() {
    return this.api.disconnect(true)
  }
}

export default AssetClaimBuilder
