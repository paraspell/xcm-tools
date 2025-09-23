import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import PeoplePolkadot from './PeoplePolkadot'

class PAssetHub<TApi, TRes> extends PeoplePolkadot<TApi, TRes> {
  constructor() {
    super('PAssetHub', 'PAssetHub - Contracts', 'Paseo', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default PAssetHub
