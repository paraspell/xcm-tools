import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import type { TPolkadotXCMTransferOptions } from './TTransfer'

export type TChainWithApi<
  TApi,
  TRes,
  TSigner,
  T = TSubstrateChain,
  TCustomChain extends string = never
> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
  chain: T
}

export type TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  origin: TChainWithApi<TApi, TRes, TSigner, TSubstrateChain | TCustomChain, TCustomChain>
  dest: TChainWithApi<TApi, TRes, TSigner, TChain, TCustomChain>
  reserve: TChainWithApi<TApi, TRes, TSigner, TChain | TCustomChain, TCustomChain>
  isSubBridge: boolean
  isSnowbridge: boolean
  isRelayAsset: boolean
  assetInfo: WithAmount<TAssetInfo>
  systemAsset: TAssetInfo
  bridgeHopChain?: TSubstrateChain
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
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
