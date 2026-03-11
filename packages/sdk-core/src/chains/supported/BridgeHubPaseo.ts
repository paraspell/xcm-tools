import { Version } from '@paraspell/sdk-common'

import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubPaseo<TApi, TRes, TSigner> extends BridgeHubPolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('BridgeHubPaseo', 'PaseoBridgeHub', 'Paseo', Version.V5)
  }
}

export default BridgeHubPaseo
