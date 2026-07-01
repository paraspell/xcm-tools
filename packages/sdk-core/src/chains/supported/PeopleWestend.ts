import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PeopleWestend<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends PeoplePolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('PeopleWestend', 'westendPeople', 'Westend', Version.V5)
  }
}

export default PeopleWestend
