import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimePaseo<TApi, TRes, TSigner> extends CoretimePolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('CoretimePaseo', 'PaseoCoretime', 'Paseo', Version.V5)
  }
}

export default CoretimePaseo
