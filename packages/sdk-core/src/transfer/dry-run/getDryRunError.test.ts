import type { TAssetInfo } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import type { TDryRunChainResult, TDryRunResult, THopInfo } from '../../types'
import { getDryRunError } from './getDryRunError'

const makeSuccessResult = (symbol: string): TDryRunChainResult => ({
  success: true,
  fee: 1n,
  asset: {
    symbol
  } as TAssetInfo,
  forwardedXcms: []
})

const makeFailureResult = (symbol: string, reason: string): TDryRunChainResult => ({
  success: false,
  asset: {
    symbol
  } as TAssetInfo,
  dryRunError: { reason }
})

const makeHop = (chain: THopInfo['chain'], result: TDryRunChainResult): THopInfo => ({
  chain,
  result
})

const makeResult = (overrides: Partial<TDryRunResult>): TDryRunResult => ({
  success: true,
  origin: makeSuccessResult('DOT'),
  hops: [],
  ...overrides
})

describe('getDryRunError', () => {
  it('returns destination failure before hops', () => {
    const failure = makeFailureResult('ASTR', 'Destination failed')
    const hop = makeHop('Hydration', makeFailureResult('DOT', 'Hop failed'))

    const result = makeResult({ destination: failure, hops: [hop] })

    const dryRunError = getDryRunError<TDryRunChainResult>(result)

    expect(dryRunError?.chainKind).toBe('destination')
    expect(dryRunError?.reason).toBe('Destination failed')
  })

  it('returns hop failure when no chain failure detected', () => {
    const failureHop = makeHop('Astar', makeFailureResult('ASTR', 'Hop failure'))

    const result = makeResult({ destination: makeSuccessResult('DOT'), hops: [failureHop] })

    const dryRunError = getDryRunError<TDryRunChainResult>(result)

    expect(dryRunError?.chainKind).toBe('hop')
    expect(dryRunError?.chain).toBe('Astar')
    expect(dryRunError?.reason).toBe('Hop failure')
  })

  it('returns undefined when no failures detected', () => {
    const result = makeResult({
      destination: makeSuccessResult('DOT'),
      hops: [makeHop('Hydration', makeSuccessResult('DOT'))]
    })

    expect(getDryRunError<TDryRunChainResult>(result)).toBeUndefined()
  })
})
