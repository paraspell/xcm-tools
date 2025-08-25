import { getSupportedPalletsDetails } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { PolkadotXcmError, type TModuleError, XTokensError } from '../../types'
import { resolveModuleError } from './resolveModuleError'

vi.mock('@paraspell/pallets', () => ({
  getSupportedPalletsDetails: vi.fn()
}))

describe('resolveModuleError', () => {
  const mockChain = {} as TSubstrateChain

  it('should return the failure reason for XTokens pallet', () => {
    const error: TModuleError = { index: '1', error: '0000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 1, name: 'XTokens' }])

    const failureReason = resolveModuleError(mockChain, error)

    expect(failureReason).toBe(Object.values(XTokensError)[0])
  })

  it('should return the failure reason for PolkadotXcm pallet', () => {
    const error: TModuleError = { index: '2', error: '0001' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const failureReason = resolveModuleError(mockChain, error)

    expect(failureReason).toBe(Object.values(PolkadotXcmError)[1])
  })

  it('should return the failure reason for PolkadotXcm pallet', () => {
    const error: TModuleError = { index: '2', error: '0002' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const failureReason = resolveModuleError(mockChain, error)

    expect(failureReason).toBe(Object.values(PolkadotXcmError)[2])
  })

  it('should throw an error if pallet is not supported', () => {
    const error: TModuleError = { index: '3', error: '0000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 3, name: 'XTransfer' }])

    expect(() => resolveModuleError(mockChain, error)).toThrowError(
      'Pallet XTransfer is not supported'
    )
  })

  it('should throw an error if pallet is not found', () => {
    const error: TModuleError = { index: '4', error: '0000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([])

    expect(() => resolveModuleError(mockChain, error)).toThrowError('Pallet with index 4 not found')
  })

  it('should throw an error if error index is not found in the pallet', () => {
    const error: TModuleError = { index: '1', error: '9999' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 1, name: 'XTokens' }])

    expect(() => resolveModuleError(mockChain, error)).toThrowError(
      'Error index 9999 not found in XTokens pallet'
    )
  })
})
