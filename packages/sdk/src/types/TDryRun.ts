import type { WithApi } from './TApi'
import type { TNodeDotKsmWithRelayChains } from './TNode'

export type TDryRunBaseOptions<TRes> = {
  /**
   * The transaction to dry-run
   */
  tx: TRes
  /**
   * The node to dry-run on
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The address to dry-run with
   */
  address: string
}

export type TDryRunOptions<TApi, TRes> = WithApi<TDryRunBaseOptions<TRes>, TApi, TRes>

export type TDryRunResult =
  | {
      success: true
      fee: bigint
    }
  | {
      success: false
      failureReason: string
    }
