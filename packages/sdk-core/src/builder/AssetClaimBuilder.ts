import type { IPolkadotApi } from '../api'
import { claimAssets } from '../pallets/assets/asset-claim'
import { type TAddress, type TMultiAsset, type TVersionClaimAssets } from '../types'
import type { TAssetClaimOptionsBase } from '../types/TAssetClaim'

/**
 * Builder class for constructing asset claim transactions.
 */
export class AssetClaimBuilder<TApi, TRes, T extends Partial<TAssetClaimOptionsBase> = object> {
  readonly api: IPolkadotApi<TApi, TRes>
  readonly _options: T

  constructor(api: IPolkadotApi<TApi, TRes>, options?: T) {
    this.api = api
    this._options = options ?? ({} as T)
  }

  /**
   * Specifies the assets to be claimed.
   *
   * @param multiAssets - An array of assets to claim in a multi-asset format.
   * @returns An instance of Builder
   */
  fungible(
    multiAssets: TMultiAsset[]
  ): AssetClaimBuilder<TApi, TRes, T & { multiAssets: TMultiAsset[] }> {
    return new AssetClaimBuilder(this.api, { ...this._options, multiAssets })
  }

  /**
   * Specifies the account address on which the assets will be claimed.
   *
   * @param address - The destination account address.
   * @returns An instance of Builder
   */
  account(address: TAddress): AssetClaimBuilder<TApi, TRes, T & { address: TAddress }> {
    return new AssetClaimBuilder(this.api, { ...this._options, address })
  }

  /**
   * Sets the XCM version to be used for the asset claim.
   *
   * @param version - The XCM version.
   * @returns An instance of Builder
   */
  xcmVersion(
    version: TVersionClaimAssets
  ): AssetClaimBuilder<TApi, TRes, T & { version: TVersionClaimAssets }> {
    return new AssetClaimBuilder(this.api, { ...this._options, version })
  }

  /**
   * Builds and returns the asset claim extrinsic.
   *
   * @returns A Promise that resolves to the asset claim extrinsic.
   */
  build(this: AssetClaimBuilder<TApi, TRes, TAssetClaimOptionsBase>) {
    return claimAssets({ api: this.api, ...this._options })
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
  disconnect() {
    return this.api.disconnect(true)
  }
}

export default AssetClaimBuilder
