import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'

const ADDITIONAL_SUBSTRATE_BRIDGE_ASSET_LOCATIONS: TLocation[] = [
  {
    parents: 2,
    interior: {
      X2: [
        { GlobalConsensus: { Ethereum: { chainId: 1 } } },
        {
          AccountKey20: {
            network: null,
            key: '0x0e186357c323c806c1efdad36d217f7a54b63d18'
          }
        }
      ]
    }
  }
]

export const isAdditionalSubstrateBridgeAsset = (asset: TAssetInfo): boolean =>
  ADDITIONAL_SUBSTRATE_BRIDGE_ASSET_LOCATIONS.some(location => deepEqual(asset.location, location))
