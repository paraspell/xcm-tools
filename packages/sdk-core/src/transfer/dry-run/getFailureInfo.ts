import type {
  TChainEndpoint,
  TDryRunChainResult,
  TDryRunError,
  TDryRunFailureInfo,
  TDryRunResult
} from '../../types'

const toFailureInfo = (
  failureChain: TChainEndpoint | undefined,
  { failureReason, failureSubReason, failureIndex }: Partial<TDryRunError>
): TDryRunFailureInfo => ({ failureChain, failureReason, failureSubReason, failureIndex })

export const getFailureInfo = (result: TDryRunResult): TDryRunFailureInfo => {
  const orderedChecks: { chain: TChainEndpoint; chainResult?: TDryRunChainResult }[] = [
    { chain: 'origin', chainResult: result.origin },
    { chain: 'destination', chainResult: result.destination },
    ...result.hops.map(hop => ({ chain: hop.chain, chainResult: hop.result }))
  ]

  for (const { chain, chainResult } of orderedChecks) {
    if (chainResult && chainResult.success === false && chainResult.failureReason) {
      return toFailureInfo(chain, chainResult)
    }
  }

  return toFailureInfo(result.failureChain, result)
}
