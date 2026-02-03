import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import PeoplePolkadot from './PeoplePolkadot'

class PAssetHub<TApi, TRes, TSigner> extends PeoplePolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('PAssetHub', 'PAssetHub - Contracts', 'Paseo', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes, TSigner>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default PAssetHub
