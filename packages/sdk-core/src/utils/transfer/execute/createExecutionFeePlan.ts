import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { TDryRunChainResult, TDryRunResult, TExecutionFeePlan } from '../../../types'
import { padValueBy } from '../../fees/padFee'

export const createExecutionFeePlan = <TCustomChain extends string = never>(
  result: TDryRunResult<TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  paddingPercentage: number
): TExecutionFeePlan<TCustomChain> => {
  const plan: Partial<Record<TChain | TCustomChain, bigint>> = {}
  const addFee = (
    chain: TChain | TCustomChain,
    chainResult: TDryRunChainResult | undefined
  ) => {
    if (chainResult?.success) {
      plan[chain] = padValueBy(chainResult.fee, paddingPercentage)
    }
  }

  addFee(origin, result.origin)

  for (const hop of result.hops) {
    addFee(hop.chain, hop.result)
  }

  addFee(destination, result.destination)

  return plan
}
