import { Version } from '@paraspell/sdk-common'

import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubPaseo<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends AssetHubPolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('AssetHubPaseo', 'PaseoAssetHub', 'Paseo', Version.V5)
  }
}

export default AssetHubPaseo
