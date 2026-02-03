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

export type TAssetClaimOptions<TApi, TRes, TSigner> = WithApi<
  TAssetClaimOptionsBase,
  TApi,
  TRes,
  TSigner
>

export type TAssetClaimInternalOptions<TApi, TRes, TSigner> = TAssetClaimOptions<
  TApi,
  TRes,
  TSigner
> & {
  version: Version
  assets: TAsset<bigint>[]
}
