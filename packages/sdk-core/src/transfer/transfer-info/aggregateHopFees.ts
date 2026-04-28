import type { TAssetInfo } from '@paraspell/assets'
import { isAssetXcEqual } from '@paraspell/assets'

import type { TXcmFeeHopInfo } from '../../types'

export const aggregateHopFees = (
  hops: TXcmFeeHopInfo[],
  matchAsset: TAssetInfo
): { totalHopFee: bigint; bridgeFee?: bigint } => {
  const totalHopFee = hops.reduce(
    (acc, hop) =>
      isAssetXcEqual(hop.result.asset, matchAsset) ? acc + (hop.result.fee ?? 0n) : acc,
    0n
  )
  const bridgeHop = hops.find(hop => hop.chain.startsWith('BridgeHub'))
  return { totalHopFee, bridgeFee: bridgeHop?.result.fee }
}
