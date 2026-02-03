import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import KiltSpiritnet from './KiltSpiritnet'

class KiltPaseo<TApi, TRes, TSigner> extends KiltSpiritnet<TApi, TRes, TSigner> {
  constructor() {
    super('KiltPaseo', 'kilt', 'Paseo', Version.V4)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes, TSigner>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default KiltPaseo
