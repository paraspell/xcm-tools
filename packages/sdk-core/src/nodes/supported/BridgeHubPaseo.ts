import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubPaseo<TApi, TRes> extends BridgeHubPolkadot<TApi, TRes> {
  constructor() {
    super('BridgeHubPaseo', 'PaseoBridgeHub', 'paseo', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }
}

export default BridgeHubPaseo
