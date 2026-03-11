import { Version } from '@paraspell/sdk-common'

import BifrostPolkadot from './BifrostPolkadot'

class BifrostPaseo<TApi, TRes, TSigner> extends BifrostPolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('BifrostPaseo', 'Bifrost(Paseo)', 'Paseo', Version.V5)
  }
}

export default BifrostPaseo
