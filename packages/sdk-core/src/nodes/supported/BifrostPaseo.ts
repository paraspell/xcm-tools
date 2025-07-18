import { Version } from '@paraspell/sdk-common'

import BifrostPolkadot from './BifrostPolkadot'

class BifrostPaseo<TApi, TRes> extends BifrostPolkadot<TApi, TRes> {
  constructor() {
    super('BifrostPaseo', 'Bifrost(Paseo)', 'paseo', Version.V4)
  }
}

export default BifrostPaseo
