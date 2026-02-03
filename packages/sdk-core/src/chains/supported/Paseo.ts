// Contains detailed structure of XCM call construction for Paseo relaychain

import { Version } from '@paraspell/sdk-common'

import Polkadot from './Polkadot'

class Paseo<TApi, TRes, TSigner> extends Polkadot<TApi, TRes, TSigner> {
  constructor() {
    super('Paseo', 'paseo', 'Paseo', Version.V5)
  }
}

export default Paseo
