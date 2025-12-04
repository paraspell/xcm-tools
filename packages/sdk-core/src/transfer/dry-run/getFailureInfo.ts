import type { TChainEndpoint, TDryRunChainResult, TDryRunResult } from '../../types'

export const getFailureInfo = (
  result: TDryRunResult
): Pick<TDryRunResult, 'failureReason' | 'failureSubReason' | 'failureChain'> => {
  const orderedChecks: { chain: TChainEndpoint; chainResult?: TDryRunChainResult }[] = [
    { chain: 'origin', chainResult: result.origin },
    { chain: 'destination', chainResult: result.destination },
    ...result.hops.map(hop => ({ chain: hop.chain, chainResult: hop.result }))
  ]

  for (const { chain, chainResult } of orderedChecks) {
    if (chainResult && chainResult.success === false && chainResult.failureReason) {
      return {
        failureChain: chain,
        failureReason: chainResult.failureReason,
        failureSubReason: chainResult.failureSubReason
      }
    }
  }

  return {
    failureChain: result.failureChain,
    failureReason: result.failureReason,
    failureSubReason: result.failureSubReason
  }
}
