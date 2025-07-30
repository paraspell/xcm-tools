import type { TAsset } from '@paraspell/assets'
import type { TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import { type TAddress } from './TTransfer'

export type TAssetClaimOptionsBase = {
  chain: TSubstrateChain
  assets: TAsset[]
  address: TAddress
  version?: Version
}

export type TAssetClaimOptions<TApi, TRes> = WithApi<TAssetClaimOptionsBase, TApi, TRes>
