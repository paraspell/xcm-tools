import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import Nodle from './Nodle'

class NodlePaseo<TApi, TRes> extends Nodle<TApi, TRes> {
  constructor() {
    super('NodlePaseo', 'NodleParadis', 'Paseo', Version.V4)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default NodlePaseo
