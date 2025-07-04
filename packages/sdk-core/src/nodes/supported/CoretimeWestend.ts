import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimeWestend<TApi, TRes> extends CoretimePolkadot<TApi, TRes> {
  constructor() {
    super('CoretimeWestend', 'westendCoretime', 'westend', Version.V4)
  }
}

export default CoretimeWestend
