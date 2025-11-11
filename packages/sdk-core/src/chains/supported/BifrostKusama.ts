// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { Version } from '@paraspell/sdk-common'

import BifrostPolkadot from './BifrostPolkadot'

class BifrostKusama<TApi, TRes> extends BifrostPolkadot<TApi, TRes> {
  constructor() {
    super('BifrostKusama', 'bifrost', 'Kusama', Version.V5)
  }
}

export default BifrostKusama
