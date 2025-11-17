import type { TAssetInfo, TAssetWithLocation, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { TPolkadotXCMTransferOptions } from './TTransfer'

export type TChainWithApi<TApi, TRes, T = TSubstrateChain> = {
  api: IPolkadotApi<TApi, TRes>
  chain: T
}

export type TTypeAndThenCallContext<TApi, TRes> = {
  origin: TChainWithApi<TApi, TRes>
  dest: TChainWithApi<TApi, TRes>
  reserve: TChainWithApi<TApi, TRes, TSubstrateChain>
  isSubBridge: boolean
  isRelayAsset: boolean
  assetInfo: WithAmount<TAssetWithLocation>
  systemAsset: TAssetInfo
  options: TPolkadotXCMTransferOptions<TApi, TRes>
}

export type TTypeAndThenFees = {
  hopFees: bigint
  destFee: bigint
}
