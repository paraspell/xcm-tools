import { describe, expect, it } from 'vitest'

import type { TChain } from '../types'
import { isSubstrateBridge } from './isSubstrateBridge'

describe('isSubstrateBridge', () => {
  it('returns true when both chains map to a supported bridge pair', () => {
    const origin: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'AssetHubKusama'

    expect(isSubstrateBridge(origin, destination)).toBe(true)
    expect(isSubstrateBridge(destination, origin)).toBe(true)
  })

  it('returns false when either chain is external', () => {
    const origin: TChain = 'Ethereum'
    const destination: TChain = 'AssetHubPolkadot'

    expect(isSubstrateBridge(origin, destination)).toBe(false)
    expect(isSubstrateBridge(destination, origin)).toBe(false)
  })

  it('returns false when chains are not AssetHub prefixed', () => {
    const origin: TChain = 'Acala'
    const destination: TChain = 'AssetHubPolkadot'

    expect(isSubstrateBridge(origin, destination)).toBe(false)
    expect(isSubstrateBridge(destination, origin)).toBe(false)
  })

  it('returns false when AssetHub chains are not a supported pair', () => {
    const origin: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'AssetHubWestend'

    expect(isSubstrateBridge(origin, destination)).toBe(false)
  })
})
