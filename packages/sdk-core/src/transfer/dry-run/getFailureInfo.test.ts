import type { TAssetInfo } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import type { TDryRunChainResult, TDryRunResult, THopInfo } from '../../types'
import { getFailureInfo } from './getFailureInfo'

const makeSuccessResult = (currency: string): TDryRunChainResult => ({
  success: true,
  fee: 1n,
  currency,
  asset: {} as TAssetInfo,
  forwardedXcms: []
})

const makeFailureResult = (currency: string, failureReason: string): TDryRunChainResult => ({
  success: false,
  currency,
  asset: {} as TAssetInfo,
  failureReason
})

const makeHop = (chain: THopInfo['chain'], result: TDryRunChainResult): THopInfo => ({
  chain,
  result
})

const makeResult = (overrides: Partial<TDryRunResult>): TDryRunResult => ({
  origin: makeSuccessResult('DOT'),
  destination: undefined,
  assetHub: undefined,
  bridgeHub: undefined,
  hops: [],
  failureChain: undefined,
  failureReason: undefined,
  ...overrides
})

describe('getFailureInfo', () => {
  it('returns destination failure before hops', () => {
    const failure = makeFailureResult('ASTR', 'Destination failed')
    const hop = makeHop('Hydration', makeFailureResult('DOT', 'Hop failed'))

    const result = makeResult({ destination: failure, hops: [hop] })

    const failureInfo = getFailureInfo(result)

    expect(failureInfo.failureChain).toBe('destination')
    expect(failureInfo.failureReason).toBe('Destination failed')
  })

  it('returns assetHub failure before hops', () => {
    const failure = makeFailureResult('DOT', 'Asset hub failed')
    const hop = makeHop('Acala', makeFailureResult('ACA', 'Hop failed'))

    const result = makeResult({ assetHub: failure, hops: [hop] })

    const failureInfo = getFailureInfo(result)

    expect(failureInfo.failureChain).toBe('assetHub')
    expect(failureInfo.failureReason).toBe('Asset hub failed')
  })

  it('returns hop failure when no chain failure detected', () => {
    const failureHop = makeHop('Astar', makeFailureResult('ASTR', 'Hop failure'))

    const result = makeResult({ destination: makeSuccessResult('DOT'), hops: [failureHop] })

    const failureInfo = getFailureInfo(result)

    expect(failureInfo.failureChain).toBe('Astar')
    expect(failureInfo.failureReason).toBe('Hop failure')
  })

  it('returns empty object when no failures detected', () => {
    const result = makeResult({
      destination: makeSuccessResult('DOT'),
      assetHub: makeSuccessResult('DOT'),
      bridgeHub: makeSuccessResult('DOT'),
      hops: [makeHop('Hydration', makeSuccessResult('DOT'))]
    })

    expect(getFailureInfo(result)).toEqual({ failureChain: undefined, failureReason: undefined })
  })
})
