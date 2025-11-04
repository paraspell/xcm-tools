import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PeopleWestend<TApi, TRes> extends PeoplePolkadot<TApi, TRes> {
  constructor() {
    super('PeopleWestend', 'westendPeople', 'westend', Version.V5)
  }
}

export default PeopleWestend
