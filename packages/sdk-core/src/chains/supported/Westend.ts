// Contains detailed structure of XCM call construction for Westend relaychain

import { Version } from '@paraspell/sdk-common'

import Polkadot from './Polkadot'

class Westend<TApi, TRes, TSigner> extends Polkadot<TApi, TRes, TSigner> {
  constructor() {
    super('Westend', 'westend', 'Westend', Version.V5)
  }
}

export default Westend
