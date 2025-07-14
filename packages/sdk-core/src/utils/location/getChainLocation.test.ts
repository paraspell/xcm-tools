import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../nodes/config'
import { getChainLocation } from './getChainLocation'

vi.mock('../../nodes/config', () => ({
  getParaId: vi.fn()
}))

describe('getChainLocation', () => {
  it('returns correct location for relay → relay', () => {
    expect(getChainLocation('Polkadot', 'Polkadot')).toEqual({
      parents: Parents.ZERO,
      interior: 'Here'
    })
  })

  it('returns correct location for relay → parachain', () => {
    vi.mocked(getParaId).mockReturnValue(2000)

    expect(getChainLocation('Polkadot', 'Moonbeam')).toEqual({
      parents: Parents.ZERO,
      interior: { X1: [{ Parachain: 2000 }] }
    })

    expect(getParaId).toHaveBeenCalledWith('Moonbeam')
  })

  it('returns correct location for parachain → relay', () => {
    expect(getChainLocation('Moonbeam', 'Polkadot')).toEqual({
      parents: Parents.ONE,
      interior: 'Here'
    })
  })

  it('returns correct location for parachain → parachain', () => {
    vi.mocked(getParaId).mockReturnValue(2001)

    expect(getChainLocation('Moonbeam', 'Acala')).toEqual({
      parents: Parents.ONE,
      interior: { X1: [{ Parachain: 2001 }] }
    })

    expect(getParaId).toHaveBeenCalledWith('Acala')
  })

  it('handles Kusama relay chain', () => {
    expect(getChainLocation('Kusama', 'Kusama')).toEqual({
      parents: Parents.ZERO,
      interior: 'Here'
    })
  })
})
