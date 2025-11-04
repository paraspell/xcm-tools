import { Version } from '@paraspell/sdk-common'

import type { TScenario, TSendInternalOptions } from '../../types'
import PeoplePolkadot from './PeoplePolkadot'

class PeoplePaseo<TApi, TRes> extends PeoplePolkadot<TApi, TRes> {
  constructor() {
    super('PeoplePaseo', 'PaseoPeopleChain', 'Paseo', Version.V5)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return false
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return false
  }
}

export default PeoplePaseo
