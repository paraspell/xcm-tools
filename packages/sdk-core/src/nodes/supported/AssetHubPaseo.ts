import { Version } from '@paraspell/sdk-common'

import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubPaseo<TApi, TRes> extends AssetHubPolkadot<TApi, TRes> {
  constructor() {
    super('AssetHubPaseo', 'PaseoAssetHub', 'paseo', Version.V4)
  }
}

export default AssetHubPaseo
