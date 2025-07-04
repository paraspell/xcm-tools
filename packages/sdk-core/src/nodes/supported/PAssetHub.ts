import { Version } from '@paraspell/sdk-common'

import PeoplePolkadot from './PeoplePolkadot'

class PAssetHub<TApi, TRes> extends PeoplePolkadot<TApi, TRes> {
  constructor() {
    super('PAssetHub', 'PAssetHub - Contracts', 'paseo', Version.V4)
  }
}

export default PAssetHub
