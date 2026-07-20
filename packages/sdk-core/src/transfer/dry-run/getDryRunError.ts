import type { TAssetInfo } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'

import type { TDryRunChainKind, TDryRunError, TDryRunFailure } from '../../types'

type TChainResult<T, TCustomChain extends string> = { chain: TChain | TCustomChain; result: T }

export const getDryRunError = <
  T extends { asset: TAssetInfo; dryRunError?: TDryRunError },
  TCustomChain extends string = never
>({
  origin,
  destination,
  hops
}: {
  origin: TChainResult<T, TCustomChain>
  destination?: TChainResult<T, TCustomChain>
  hops: TChainResult<T, TCustomChain>[]
}): TDryRunFailure<TCustomChain> | undefined => {
  const toCandidate = (chainKind: TDryRunChainKind, entry: TChainResult<T, TCustomChain>) => ({
    chainKind,
    ...entry
  })

  const candidates = [
    toCandidate('origin', origin),
    ...(destination ? [toCandidate('destination', destination)] : []),
    ...hops.map(hop => toCandidate('hop', hop))
  ]

  for (const { chainKind, chain, result } of candidates) {
    if (result.dryRunError?.reason) {
      return { chainKind, chain, ...result.dryRunError }
    }
  }

  return undefined
}
