// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { Version } from '@paraspell/sdk-common'

import BifrostPolkadot from './BifrostPolkadot'

class BifrostKusama<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends BifrostPolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('BifrostKusama', 'bifrost', 'Kusama', Version.V5)
  }
}

export default BifrostKusama
