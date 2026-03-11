import { Version } from '@paraspell/sdk-common'

import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubWestend<TApi, TRes, TSigner> extends AssetHubPolkadot<TApi, TRes, TSigner> {
  constructor() {
    super('AssetHubWestend', 'WestendAssetHub', 'Westend', Version.V5)
  }
}

export default AssetHubWestend
