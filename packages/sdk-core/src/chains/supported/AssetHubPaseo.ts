import { Version } from '@paraspell/sdk-common'

import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubPaseo<TApi, TRes, TSigner> extends AssetHubPolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('AssetHubPaseo', 'PaseoAssetHub', 'Paseo', Version.V5)
  }
}

export default AssetHubPaseo
