import type { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import { claimAssets } from '../transfer'
import type { TBuilderInternalOptions, TSender } from '../types'
import { type TAddress } from '../types'
import type { TAssetClaimOptionsBase } from '../types/TAssetClaim'
import { assertSender, isSenderSigner } from '../utils'

/**
 * Builder class for constructing asset claim transactions.
 */
export class AssetClaimBuilder<
  TApi,
  TRes,
  TSigner,
  T extends Partial<TAssetClaimOptionsBase & TBuilderInternalOptions<TSigner>> = object
> {
  readonly api: IPolkadotApi<TApi, TRes, TSigner>
  readonly _options: T

  constructor(api: IPolkadotApi<TApi, TRes, TSigner>, options?: T) {
    this.api = api
    this._options = options ?? ({} as T)
  }

  /**
   * Specifies the assets to be claimed.
   *
   * @param assets - An array of assets to claim in a multi-asset format.
   * @returns An instance of Builder
   */
  currency(
    currency: TAssetClaimOptionsBase['currency']
  ): AssetClaimBuilder<TApi, TRes, TSigner, T & { currency: TAssetClaimOptionsBase['currency'] }> {
    return new AssetClaimBuilder(this.api, { ...this._options, currency })
  }

  /**
   * Sets the sender address.
   *
   * @param address - The sender address.
   * @returns
   */
  senderAddress(
    sender: TSender<TSigner>
  ): AssetClaimBuilder<TApi, TRes, TSigner, T & { senderAddress: string }> {
    const isPath = typeof sender === 'string' && sender.startsWith('//')
    const isPathOrSigner = isPath || isSenderSigner(sender)
    const address = isPathOrSigner ? this.api.deriveAddress(sender) : sender
    return new AssetClaimBuilder(this.api, {
      ...this._options,
      senderAddress: address,
      sender: isPathOrSigner ? sender : undefined
    })
  }

  /**
   * Specifies the account address on which the assets will be claimed.
   *
   * @param address - The destination account address.
   * @returns An instance of Builder
   */
  address(address: TAddress): AssetClaimBuilder<TApi, TRes, TSigner, T & { address: TAddress }> {
    const isPath = typeof address === 'string' && address.startsWith('//')
    const resolvedAddress = isPath ? this.api.deriveAddress(address) : address
    return new AssetClaimBuilder(this.api, { ...this._options, address: resolvedAddress })
  }

  /**
   * Sets the XCM version to be used for the asset claim.
   *
   * @param version - The XCM version.
   * @returns An instance of Builder
   */
  xcmVersion(version: Version): AssetClaimBuilder<TApi, TRes, TSigner, T & { version: Version }> {
    return new AssetClaimBuilder(this.api, { ...this._options, version })
  }

  /**
   * Builds and returns the asset claim extrinsic.
   *
   * @returns A Promise that resolves to the asset claim extrinsic.
   */
  build(this: AssetClaimBuilder<TApi, TRes, TSigner, TAssetClaimOptionsBase>) {
    return claimAssets({ api: this.api, ...this._options })
  }

  async signAndSubmit(
    this: AssetClaimBuilder<
      TApi,
      TRes,
      TSigner,
      TAssetClaimOptionsBase & TBuilderInternalOptions<TSigner>
    >
  ) {
    const { sender } = this._options
    assertSender(sender)
    const tx = await claimAssets({ api: this.api, ...this._options })
    return this.api.signAndSubmit(tx, sender)
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
