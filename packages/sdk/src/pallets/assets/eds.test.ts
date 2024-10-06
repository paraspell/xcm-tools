import { describe, it, expect, vi } from 'vitest'
import type { TNodeDotKsmWithRelayChains } from '../../types'
import { getExistentialDeposit } from './eds'

vi.mock('../../maps/existential-deposits.json', () => ({
  Kusama: '0.01',
  Polkadot: '1.00',
  RelayChain1: '0.1',
  NonExistentNode: null
}))

describe('getExistentialDeposit', () => {
  it('should return the correct existential deposit for a known node', () => {
    const node = 'Kusama' as TNodeDotKsmWithRelayChains
    const expectedEd = '0.01'

    const ed = getExistentialDeposit(node)

    expect(ed).toEqual(expectedEd)
  })

  it('should return null for a node without an existential deposit', () => {
    const node = 'NonExistentNode' as TNodeDotKsmWithRelayChains

    const ed = getExistentialDeposit(node)

    expect(ed).toBeNull()
  })
})
