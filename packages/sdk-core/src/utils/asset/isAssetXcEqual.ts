import { deepEqual } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import type { TChainAssetInfo } from '../../types'

export const isAssetXcEqualImpl = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  a: TChainAssetInfo<TCustomChain>,
  b: TChainAssetInfo<TCustomChain>
): boolean =>
  deepEqual(
    api.localizeLocation(a.chain, a.asset.location, a.chain),
    api.localizeLocation(a.chain, b.asset.location, b.chain)
  )
