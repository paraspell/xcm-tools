import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PeoplePaseo<TApi, TRes, TSigner, TCustomChain extends string = never> extends PeoplePolkadot<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('PeoplePaseo', 'PaseoPeopleChain', 'Paseo', Version.V5)
  }
}

export default PeoplePaseo
