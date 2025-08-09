import type { TAssetWithLocation, WithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { TPolkadotXCMTransferOptions } from './TTransfer'

export type TChainWithApi<TApi, TRes, T = TNodeDotKsmWithRelayChains> = {
  api: IPolkadotApi<TApi, TRes>
  chain: T
}

export type TTypeAndThenCallContext<TApi, TRes> = {
  origin: TChainWithApi<TApi, TRes>
  dest: TChainWithApi<TApi, TRes>
  reserve: TChainWithApi<TApi, TRes, TNodeDotKsmWithRelayChains>
  asset: WithAmount<TAssetWithLocation>
  options: TPolkadotXCMTransferOptions<TApi, TRes>
}

export type TTypeAndThenFees = {
  reserveFee: bigint
  refundFee: bigint
  destFee: bigint
}
