import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { TPolkadotXCMTransferOptions } from './TTransfer'

export type TChainWithApi<TApi, TRes, TSigner, T = TSubstrateChain> = {
  api: IPolkadotApi<TApi, TRes, TSigner>
  chain: T
}

export type TTypeAndThenCallContext<TApi, TRes, TSigner> = {
  origin: TChainWithApi<TApi, TRes, TSigner>
  dest: TChainWithApi<TApi, TRes, TSigner>
  reserve: TChainWithApi<TApi, TRes, TSigner, TChain>
  isSubBridge: boolean
  isSnowbridge: boolean
  isRelayAsset: boolean
  assetInfo: WithAmount<TAssetInfo>
  systemAsset: TAssetInfo
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
}

export type TTypeAndThenFees = {
  hopFees: bigint
  destFee: bigint
}

export type TTypeAndThenOverrides = {
  reserveChain?: TSubstrateChain
  // When true, will not include relay fee asset in the transfer
  noFeeAsset?: boolean
}
