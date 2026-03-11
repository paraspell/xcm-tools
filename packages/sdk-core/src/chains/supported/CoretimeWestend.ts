import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimeWestend<TApi, TRes, TSigner> extends CoretimePolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('CoretimeWestend', 'westendCoretime', 'Westend', Version.V5)
  }
}

export default CoretimeWestend
