import { Version } from '@paraspell/sdk-common'

import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubWestend<TApi, TRes> extends AssetHubPolkadot<TApi, TRes> {
  constructor() {
    super('AssetHubWestend', 'WestendAssetHub', 'westend', Version.V5)
  }
}

export default AssetHubWestend
