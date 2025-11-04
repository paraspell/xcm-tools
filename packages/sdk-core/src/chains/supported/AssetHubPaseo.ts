import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubPaseo<TApi, TRes> extends AssetHubPolkadot<TApi, TRes> {
  constructor() {
    super('AssetHubPaseo', 'PaseoAssetHub', 'Paseo', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }
}

export default AssetHubPaseo
