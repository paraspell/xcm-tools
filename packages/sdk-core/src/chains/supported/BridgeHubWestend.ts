import { Version } from '@paraspell/sdk-common'

import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubWestend<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends BridgeHubPolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('BridgeHubWestend', 'westendBridgeHub', 'Westend', Version.V5)
  }
}

export default BridgeHubWestend
