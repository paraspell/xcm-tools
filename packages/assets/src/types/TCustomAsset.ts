import type { TChain } from '@paraspell/sdk-common'

import type { TAssetInfo, TChainAssetsInfo } from './TAssetInfo'

export type TCustomAssetInfo = TAssetInfo & {
  forceOverride?: boolean
}

export type TCustomAssetsMap = Partial<Record<TChain, TCustomAssetInfo[]>>
export type TCustomAssetsMapNormalized = Partial<Record<TChain, TAssetInfo[]>>

export type TCustomCtx = {
  customAssets?: TCustomAssetsMapNormalized
  customChainAssets?: Record<string, TChainAssetsInfo>
}
