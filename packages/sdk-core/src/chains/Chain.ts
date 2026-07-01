// Contains the base class shared by every chain (substrate parachains, relaychains and external chains)

import type { TAssetInfo } from '@paraspell/assets'
import type { TChain, TRelaychain, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'

abstract class Chain<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
  TChainName extends TChain | TCustomChain = TChain | TCustomChain
> {
  private readonly _chain: TChainName

  private readonly _ecosystem: TRelaychain

  private readonly _version: Version

  constructor(chain: TChainName, ecosystem: TRelaychain, version: Version) {
    this._ecosystem = ecosystem
    this._chain = chain
    this._version = version
  }

  get ecosystem(): TRelaychain {
    return this._ecosystem
  }

  get chain(): TChainName {
    return this._chain
  }

  get version(): Version {
    return this._version
  }

  abstract getBalance(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint>
}

export default Chain
