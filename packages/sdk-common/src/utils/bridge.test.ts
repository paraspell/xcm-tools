import { describe, expect, it } from 'vitest'

import type { TChain } from '../types'
import { isBridge, isSnowbridge, isSubstrateBridge } from './bridge'

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

describe('isSnowbridge', () => {
  it('returns true when destination is an external chain', () => {
    const origin: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'Ethereum'

    expect(isSnowbridge(origin, destination)).toBe(true)
    expect(isSnowbridge(destination, origin)).toBe(false)
  })

  it('returns false when destination is a substrate chain', () => {
    const origin: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'AssetHubKusama'

    expect(isSnowbridge(origin, destination)).toBe(false)
    expect(isSnowbridge(destination, origin)).toBe(false)
  })
})

describe('isBridge', () => {
  it('returns true for substrate bridges', () => {
    const origin: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'AssetHubKusama'

    expect(isBridge(origin, destination)).toBe(true)
  })

  it('returns true for snowbridge transfers', () => {
    const origin: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'Ethereum'

    expect(isBridge(origin, destination)).toBe(true)
  })

  it('returns false when neither bridge type applies', () => {
    const origin: TChain = 'Acala'
    const destination: TChain = 'Moonbeam'

    expect(isBridge(origin, destination)).toBe(false)
  })
})
