import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../nodes/config'
import { getChainLocation } from './getChainLocation'

vi.mock('../../nodes/config', () => ({
  getParaId: vi.fn()
}))

describe('getChainLocation', () => {
  it('should return Here for Polkadot', () => {
    const result = getChainLocation('Polkadot')

    const expected: TMultiLocation = {
      parents: Parents.ONE,
      interior: 'Here'
    }

    expect(result).toEqual(expected)
    expect(getParaId).not.toHaveBeenCalled()
  })

  it('should return X1 with parachain id for non-Polkadot chains', () => {
    vi.mocked(getParaId).mockReturnValue(2000)
    const result = getChainLocation('Moonbeam')

    const expected: TMultiLocation = {
      parents: Parents.ONE,
      interior: {
        X1: [{ Parachain: 2000 }]
      }
    }

    expect(result).toEqual(expected)
    expect(getParaId).toHaveBeenCalledWith('Moonbeam')
  })
})
