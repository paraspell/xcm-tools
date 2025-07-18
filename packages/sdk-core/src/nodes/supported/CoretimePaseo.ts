import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimePaseo<TApi, TRes> extends CoretimePolkadot<TApi, TRes> {
  constructor() {
    super('CoretimePaseo', 'PaseoCoretime', 'paseo', Version.V4)
  }
}

export default CoretimePaseo
