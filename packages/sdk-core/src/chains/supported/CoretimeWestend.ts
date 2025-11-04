import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import CoretimePolkadot from './CoretimePolkadot'

class CoretimeWestend<TApi, TRes> extends CoretimePolkadot<TApi, TRes> {
  constructor() {
    super('CoretimeWestend', 'westendCoretime', 'Westend', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }
}

export default CoretimeWestend
