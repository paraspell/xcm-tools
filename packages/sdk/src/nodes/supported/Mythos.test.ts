import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import { Version, PolkadotXCMTransferInput } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import Mythos from './Mythos'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Mythos', () => {
  let mythos: Mythos
  const mockInput = {
    currencySymbol: 'MYTH',
    scenario: 'ParaToPara',
    destination: 'Acala',
    amount: '100'
  } as PolkadotXCMTransferInput

  beforeEach(() => {
    mythos = getNode('Mythos')
  })

  it('should initialize with correct values', () => {
    expect(mythos.node).toBe('Mythos')
    expect(mythos.name).toBe('mythos')
    expect(mythos.type).toBe('polkadot')
    expect(mythos.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for non-AssetHubPolkadot destination', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    mythos.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limitedReserveTransferAssets', 'Unlimited')
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for AssetHubPolkadot destination', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    mythos.transferPolkadotXCM({ ...mockInput, destination: 'AssetHubPolkadot' })

    expect(spy).toHaveBeenCalledWith(
      { ...mockInput, destination: 'AssetHubPolkadot' },
      'limitedTeleportAssets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as PolkadotXCMTransferInput

    expect(() => mythos.transferPolkadotXCM(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('NOT_MYTH')

    expect(() => mythos.transferPolkadotXCM(mockInput)).toThrowError(
      new InvalidCurrencyError(`Node Mythos does not support currency MYTH`)
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => mythos.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
