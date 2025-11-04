import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PeoplePaseo<TApi, TRes> extends PeoplePolkadot<TApi, TRes> {
  constructor() {
    super('PeoplePaseo', 'PaseoPeopleChain', 'Paseo', Version.V5)
  }
}

export default PeoplePaseo
