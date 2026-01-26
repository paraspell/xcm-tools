// Contains detailed structure of XCM call construction for Westend relaychain

import { Version } from '@paraspell/sdk-common'

import Polkadot from './Polkadot'

class Westend<TApi, TRes> extends Polkadot<TApi, TRes> {
  constructor() {
    super('Westend', 'westend', 'Westend', Version.V5)
  }
}

export default Westend
