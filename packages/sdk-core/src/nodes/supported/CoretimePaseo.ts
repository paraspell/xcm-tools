import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimePaseo<TApi, TRes> extends CoretimePolkadot<TApi, TRes> {
  constructor() {
    super('CoretimePaseo', 'PaseoCoretime', 'paseo', Version.V5)
  }
}

export default CoretimePaseo
