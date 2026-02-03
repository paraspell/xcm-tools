import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PeopleWestend<TApi, TRes, TSigner> extends PeoplePolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('PeopleWestend', 'westendPeople', 'Westend', Version.V5)
  }
}

export default PeopleWestend
