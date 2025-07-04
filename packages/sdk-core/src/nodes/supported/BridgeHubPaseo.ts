import { Version } from '@paraspell/sdk-common'

import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubPaseo<TApi, TRes> extends BridgeHubPolkadot<TApi, TRes> {
  constructor() {
    super('BridgeHubPaseo', 'PaseoBridgeHub', 'paseo', Version.V4)
  }
}

export default BridgeHubPaseo
