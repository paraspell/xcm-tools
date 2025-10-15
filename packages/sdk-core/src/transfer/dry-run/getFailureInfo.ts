import type { TDryRunChain, TDryRunChainResult, TDryRunResult } from '../../types'

export const getFailureInfo = (
  result: TDryRunResult
): Pick<TDryRunResult, 'failureReason' | 'failureChain'> => {
  const orderedChecks: { chain: TDryRunChain; chainResult?: TDryRunChainResult }[] = [
    { chain: 'origin', chainResult: result.origin },
    { chain: 'destination', chainResult: result.destination },
    { chain: 'assetHub', chainResult: result.assetHub },
    { chain: 'bridgeHub', chainResult: result.bridgeHub },
    ...result.hops.map(hop => ({ chain: hop.chain, chainResult: hop.result }))
  ]

  for (const { chain, chainResult } of orderedChecks) {
    if (chainResult && chainResult.success === false && chainResult.failureReason) {
      return { failureChain: chain, failureReason: chainResult.failureReason }
    }
  }

  return {
    failureChain: result.failureChain,
    failureReason: result.failureReason
  }
}
