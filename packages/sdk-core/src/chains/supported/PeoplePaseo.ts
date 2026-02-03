import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PeoplePaseo<TApi, TRes, TSigner> extends PeoplePolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('PeoplePaseo', 'PaseoPeopleChain', 'Paseo', Version.V5)
  }
}

export default PeoplePaseo
