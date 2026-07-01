import { Version } from '@paraspell/sdk-common'

import CoretimePolkadot from './CoretimePolkadot'

class CoretimePaseo<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends CoretimePolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('CoretimePaseo', 'PaseoCoretime', 'Paseo', Version.V5)
  }
}

export default CoretimePaseo
