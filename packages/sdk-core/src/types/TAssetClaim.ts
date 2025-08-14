import type { TAmount, TAsset, TCurrencyCore, WithComplexAmount } from '@paraspell/assets'
import type { TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import { type TAddress } from './TTransfer'

export type TAssetClaimOptionsBase = {
  chain: TSubstrateChain
  currency:
    | WithComplexAmount<TCurrencyCore>
    | TAsset<TAmount>[]
    | WithComplexAmount<TCurrencyCore>[]
  address: TAddress
  version?: Version
}

export type TAssetClaimOptions<TApi, TRes> = WithApi<TAssetClaimOptionsBase, TApi, TRes>

export type TAssetClaimInternalOptions<TApi, TRes> = TAssetClaimOptions<TApi, TRes> & {
  version: Version
  assets: TAsset<bigint>[]
}
