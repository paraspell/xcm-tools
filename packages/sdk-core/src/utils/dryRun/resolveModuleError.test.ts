import { getSupportedPalletsDetails } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import {
  PolkadotXcmError,
  PolkadotXcmExecutionError,
  type TModuleError,
  XTokensError
} from '../../types'
import { resolveModuleError } from './resolveModuleError'

vi.mock('@paraspell/pallets')

describe('resolveModuleError', () => {
  const mockChain = {} as TSubstrateChain

  it('should return the failure reason for XTokens pallet', () => {
    const error: TModuleError = { index: '1', error: '0x00' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 1, name: 'XTokens' }])

    const { failureReason } = resolveModuleError(mockChain, error)

    expect(failureReason).toBe(Object.values(XTokensError)[0])
  })

  it('should return the failure reason for PolkadotXcm pallet', () => {
    const error: TModuleError = { index: '2', error: '0x01' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const { failureReason } = resolveModuleError(mockChain, error)

    expect(failureReason).toBe(Object.values(PolkadotXcmError)[1])
  })

  it('should return the failure reason for PolkadotXcm pallet', () => {
    const error: TModuleError = { index: '2', error: '0x02' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const { failureReason } = resolveModuleError(mockChain, error)

    expect(failureReason).toBe(Object.values(PolkadotXcmError)[2])
  })

  it('should throw an error if pallet is not supported', () => {
    const error: TModuleError = { index: '3', error: '0x00' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 3, name: 'System' }])

    expect(() => resolveModuleError(mockChain, error)).toThrow('Pallet System is not supported')
  })

  it('should throw an error if pallet is not found', () => {
    const error: TModuleError = { index: '4', error: '0x00' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([])

    expect(() => resolveModuleError(mockChain, error)).toThrow('Pallet with index 4 not found')
  })

  it('should throw an error if error index is not found in the pallet', () => {
    const error: TModuleError = { index: '1', error: '0xff' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 1, name: 'XTokens' }])

    expect(() => resolveModuleError(mockChain, error)).toThrow(
      'Error index 255 not found in XTokens pallet'
    )
  })

  it('should return failure reason and sub-reason for LocalExecutionIncompleteWithError', () => {
    // 0x1c00 - 26 (LocalExecutionIncompleteWithError), 0x10 - 10 (UnknownClaim)
    const error: TModuleError = { index: '2', error: '0x1c001000' }
    vi.mocked(getSupportedPalletsDetails).mockReturnValue([{ index: 2, name: 'PolkadotXcm' }])

    const result = resolveModuleError(mockChain, error)

    expect(result).toEqual({
      failureReason: PolkadotXcmError.LocalExecutionIncompleteWithError,
      failureSubReason: PolkadotXcmExecutionError.UnknownClaim
    })
  })
})
