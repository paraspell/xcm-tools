import { Version } from '@paraspell/sdk-common'

import BridgeHubPolkadot from './BridgeHubPolkadot'

class BridgeHubPaseo<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends BridgeHubPolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('BridgeHubPaseo', 'PaseoBridgeHub', 'Paseo', Version.V5)
  }
}

export default BridgeHubPaseo
