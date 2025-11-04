import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubWestend<TApi, TRes> extends AssetHubPolkadot<TApi, TRes> {
  constructor() {
    super('AssetHubWestend', 'WestendAssetHub', 'Westend', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }
}

export default AssetHubWestend
