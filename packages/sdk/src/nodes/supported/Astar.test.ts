import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, PolkadotXCMTransferInput } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import XTokensTransferImpl from '../xTokens'
import type Astar from './Astar'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Astar', () => {
  let astar: Astar
  const mockPolkadotXCMInput = {
    scenario: 'ParaToPara',
    currencySymbol: 'DOT',
    amount: '100'
  } as PolkadotXCMTransferInput

  const mockXTokensInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    astar = getNode('Astar')
  })

  it('should initialize with correct values', () => {
    expect(astar.node).toBe('Astar')
    expect(astar.name).toBe('astar')
    expect(astar.type).toBe('polkadot')
    expect(astar.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with reserveTransferAssets for ParaToPara scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    astar.transferPolkadotXCM(mockPolkadotXCMInput)

    expect(spy).toHaveBeenCalledWith(mockPolkadotXCMInput, 'reserveTransferAssets')
  })

  it('should call transferPolkadotXCM with reserveWithdrawAssets for non-ParaToPara scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    const inputWithDifferentScenario = {
      ...mockPolkadotXCMInput,
      scenario: 'RelayToPara'
    } as PolkadotXCMTransferInput

    astar.transferPolkadotXCM(inputWithDifferentScenario)

    expect(spy).toHaveBeenCalledWith(inputWithDifferentScenario, 'reserveWithdrawAssets')
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    astar.transferXTokens(mockXTokensInput)

    expect(spy).toHaveBeenCalledWith(mockXTokensInput, '123')
  })
})
