import { describe, expect, it, vi } from 'vitest'

import { getSupportedPalletsDetails } from '../../pallets/pallets'
import {
  PolkadotXcmError,
  type TModuleError,
  type TNodeDotKsmWithRelayChains,
  XTokensError
} from '../../types'
import { resolveModuleError } from './resolveModuleError'

vi.mock('../../pallets/pallets', () => ({
  getSupportedPalletsDetails: vi.fn()
}))

describe('resolveModuleError', () => {
  const mockNode: TNodeDotKsmWithRelayChains = {} as TNodeDotKsmWithRelayChains

  it('should return the failure reason for XTokens pallet', () => {
    const error: TModuleError = { index: '1', error: '0000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 1, name: 'XTokens' }])

    const failureReason = resolveModuleError(mockNode, error)

    expect(failureReason).toBe(Object.values(XTokensError)[0])
  })

  it('should return the failure reason for PolkadotXcm pallet', () => {
    const error: TModuleError = { index: '2', error: '0001' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const failureReason = resolveModuleError(mockNode, error)

    expect(failureReason).toBe(Object.values(PolkadotXcmError)[1])
  })

  it('should return the failure reason for PolkadotXcm pallet', () => {
    const error: TModuleError = { index: '2', error: '0002' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const failureReason = resolveModuleError(mockNode, error)

    expect(failureReason).toBe(Object.values(PolkadotXcmError)[2])
  })

  it('should throw an error if pallet is not supported', () => {
    const error: TModuleError = { index: '3', error: '0000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 3, name: 'RelayerXcm' }])

    expect(() => resolveModuleError(mockNode, error)).toThrowError(
      'Pallet RelayerXcm is not supported'
    )
  })

  it('should throw an error if pallet is not found', () => {
    const error: TModuleError = { index: '4', error: '0000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([])

    expect(() => resolveModuleError(mockNode, error)).toThrowError('Pallet with index 4 not found')
  })

  it('should throw an error if error index is not found in the pallet', () => {
    const error: TModuleError = { index: '1', error: '9999' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 1, name: 'XTokens' }])

    expect(() => resolveModuleError(mockNode, error)).toThrowError(
      'Error index 9999 not found in XTokens pallet'
    )
  })
})
