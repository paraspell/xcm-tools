import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimeWestend<TApi, TRes> extends CoretimePolkadot<TApi, TRes> {
  constructor() {
    super('CoretimeWestend', 'westendCoretime', 'westend', Version.V5)
  }
}

export default CoretimeWestend
