// Contains detailed structure of XCM call construction for Kusama relaychain

import { Version } from '@paraspell/sdk-common'

import Polkadot from './Polkadot'

class Kusama<TApi, TRes, TSigner> extends Polkadot<TApi, TRes, TSigner> {
  constructor() {
    super('Kusama', 'kusama', 'Kusama', Version.V5)
  }
}

export default Kusama
