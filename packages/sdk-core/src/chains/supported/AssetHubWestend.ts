import { Version } from '@paraspell/sdk-common'

import AssetHubPolkadot from './AssetHubPolkadot'

class AssetHubWestend<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> extends AssetHubPolkadot<TApi, TRes, TSigner, TCustomChain> {
  constructor() {
    super('AssetHubWestend', 'WestendAssetHub', 'Westend', Version.V5)
  }
}

export default AssetHubWestend
