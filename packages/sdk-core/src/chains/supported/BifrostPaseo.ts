import { Version } from '@paraspell/sdk-common'

import BifrostPolkadot from './BifrostPolkadot'

class BifrostPaseo<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends BifrostPolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('BifrostPaseo', 'Bifrost(Paseo)', 'Paseo', Version.V5)
  }
}

export default BifrostPaseo
