import { Version } from '@paraspell/sdk-common'

import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubWestend<TApi, TRes, TSigner> extends BridgeHubPolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('BridgeHubWestend', 'westendBridgeHub', 'Westend', Version.V5)
  }
}

export default BridgeHubWestend
