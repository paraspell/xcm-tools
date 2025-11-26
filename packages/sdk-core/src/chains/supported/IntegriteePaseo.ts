// Contains detailed structure of XCM call construction for the IntegriteePaseo Parachain

import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import IntegriteeKusama from './IntegriteeKusama'

class IntegriteePaseo<TApi, TRes> extends IntegriteeKusama<TApi, TRes> {
  constructor() {
    super('IntegriteePaseo', 'integritee', 'Paseo', Version.V4)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default IntegriteePaseo
