import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PAssetHub<TApi, TRes> extends PeoplePolkadot<TApi, TRes> {
  constructor() {
    super('PAssetHub', 'PAssetHub - Contracts', 'Paseo', Version.V5)
  }
}

export default PAssetHub
