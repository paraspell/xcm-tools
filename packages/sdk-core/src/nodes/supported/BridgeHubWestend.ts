import { Version } from '@paraspell/sdk-common'

import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubWestend<TApi, TRes> extends BridgeHubPolkadot<TApi, TRes> {
  constructor() {
    super('BridgeHubWestend', 'westendBridgeHub', 'westend', Version.V5)
  }
}

export default BridgeHubWestend
