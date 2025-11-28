import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import KiltSpiritnet from './KiltSpiritnet'

class KiltPaseo<TApi, TRes> extends KiltSpiritnet<TApi, TRes> {
  constructor() {
    super('KiltPaseo', 'kilt', 'Paseo', Version.V4)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default KiltPaseo
