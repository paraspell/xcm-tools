import type { TAssetInfo } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'

import type { TDryRunChainKind, TDryRunError, TDryRunFailure } from '../../types'

export const getDryRunError = <T extends { asset: TAssetInfo; dryRunError?: TDryRunError }>({
  origin,
  destination,
  hops
}: {
  origin: T
  destination?: T
  hops: { chain: TChain; result: T }[]
}): TDryRunFailure | undefined => {
  const entries: { chainKind: TDryRunChainKind; chain?: TChain; result: T }[] = [
    { chainKind: 'origin', result: origin },
    ...(destination ? [{ chainKind: 'destination' as const, result: destination }] : []),
    ...hops.map(hop => ({ chainKind: 'hop' as const, chain: hop.chain, result: hop.result }))
  ]

  for (const { chainKind, chain, result } of entries) {
    if (result.dryRunError?.reason) {
      return { chainKind, chain, ...result.dryRunError }
    }
  }

  return undefined
}
