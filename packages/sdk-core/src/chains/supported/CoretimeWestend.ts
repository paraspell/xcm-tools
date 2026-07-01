import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimeWestend<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends CoretimePolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('CoretimeWestend', 'westendCoretime', 'Westend', Version.V5)
  }
}

export default CoretimeWestend
