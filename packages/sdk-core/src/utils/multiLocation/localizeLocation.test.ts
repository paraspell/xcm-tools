import { Parents, type TMultiLocation, type TNodeWithRelayChains } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { localizeLocation } from './localizeLocation'

describe('localizeLocation', () => {
  const relayChainNode: TNodeWithRelayChains = 'Polkadot'
  const parachainNode: TNodeWithRelayChains = 'Acala'

  it('should return interior as "Here" and set parents to 0 if input interior is "Here" and node is relay chain', () => {
    const input = { parents: 5, interior: 'Here' } as const
    const result = localizeLocation(relayChainNode, input)
    expect(result.interior).toBe('Here')
    expect(result.parents).toBe(Parents.ZERO)
  })

  it('should keep parents unchanged if input interior is "Here" and node is not relay chain', () => {
    const input = { parents: 5, interior: 'Here' } as const
    const result = localizeLocation(parachainNode, input)
    expect(result.interior).toBe('Here')
    expect(result.parents).toBe(5)
  })

  it('should filter out the "Parachain" junction and set parents to 0 if one is found', () => {
    const input: TMultiLocation = {
      parents: 0,
      interior: {
        X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 50000028 }]
      }
    }
    const result = localizeLocation(parachainNode, input)
    expect(result.parents).toBe(Parents.ZERO)
    expect(result.interior).toEqual({
      X2: [{ PalletInstance: 50 }, { GeneralIndex: 50000028 }]
    })
  })

  it('should return interior as "Here" and set parents to 0 if all junctions are filtered out', () => {
    const input: TMultiLocation = {
      parents: 2,
      interior: {
        X1: [{ Parachain: 123 }]
      }
    }
    const result = localizeLocation(parachainNode, input)
    expect(result.parents).toBe(Parents.ZERO)
    expect(result.interior).toBe('Here')
  })

  it('should not change parents if no Parachain is present and interior is not "Here"', () => {
    const input: TMultiLocation = {
      parents: 3,
      interior: {
        X2: [{ PalletInstance: 99 }, { GeneralKey: { length: 3, data: 'abc' } }]
      }
    }
    const result = localizeLocation(parachainNode, input)
    expect(result.parents).toBe(3)
    expect(result.interior).toEqual(input.interior)
  })
})
