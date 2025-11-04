import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubWestend<TApi, TRes> extends BridgeHubPolkadot<TApi, TRes> {
  constructor() {
    super('BridgeHubWestend', 'westendBridgeHub', 'westend', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }
}

export default BridgeHubWestend
