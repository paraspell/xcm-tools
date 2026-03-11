import { Parents, RELAYCHAINS, type TRelaychain } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TAssetInfo } from '../types'
import { isBridgedSystemAsset, isSystemAsset } from './isSystemAsset'

const createAsset = (location: TAssetInfo['location']): TAssetInfo => ({
  symbol: 'TEST',
  decimals: 12,
  location
})

describe('isBridgedSystemAsset', () => {
  it('returns true when parents is TWO and GlobalConsensus matches relay chain', () => {
    const relayChain: TRelaychain = 'Polkadot'
    const asset = createAsset({
      parents: Parents.TWO,
      interior: {
        X1: [{ GlobalConsensus: { [relayChain.toLowerCase()]: null } }]
      }
    })

    expect(isBridgedSystemAsset(asset, [relayChain])).toBe(true)
  })

  it('returns false when parents is not TWO even if GlobalConsensus matches', () => {
    const relayChain: TRelaychain = 'Polkadot'
    const asset = createAsset({
      parents: Parents.ONE,
      interior: {
        X1: [{ GlobalConsensus: { [relayChain.toLowerCase()]: null } }]
      }
    })

    expect(isBridgedSystemAsset(asset, [relayChain])).toBe(false)
  })

  it('returns false when GlobalConsensus does not match provided relay chains', () => {
    const asset = createAsset({
      parents: Parents.TWO,
      interior: {
        X1: [{ GlobalConsensus: { polkadot: null } }]
      }
    })

    expect(isBridgedSystemAsset(asset, ['Kusama'])).toBe(false)
  })
})

describe('isSystemAsset', () => {
  it('returns true for relay-chain Here system asset', () => {
    const asset = createAsset({
      parents: Parents.ONE,
      interior: { Here: null }
    })

    expect(isSystemAsset(asset)).toBe(true)
  })

  it('returns true for bridged system asset matching known relay chains', () => {
    const relayChain = RELAYCHAINS[0]
    const asset = createAsset({
      parents: Parents.TWO,
      interior: {
        X1: [{ GlobalConsensus: { [relayChain.toLowerCase()]: null } }]
      }
    })

    expect(isSystemAsset(asset)).toBe(true)
  })

  it('returns false for non-system, non-bridged assets', () => {
    const asset = createAsset({
      parents: Parents.ZERO,
      interior: {
        X1: [{ Parachain: 2000 }]
      }
    })

    expect(isSystemAsset(asset)).toBe(false)
  })
})
