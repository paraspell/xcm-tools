import { describe, it, expect, vi } from 'vitest'
import { ethers } from 'ethers'
import { createAccID } from '../../utils'
import { getDestination } from './getDestination'
import type { XTransferTransferInput } from '../../types'

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn()
  }
}))

vi.mock('../../utils', () => ({
  createAccID: vi.fn()
}))

describe('getDestination', () => {
  it('returns the recipientAddress as if it is a multi-location object', () => {
    const input = {
      recipientAddress: {
        parents: 1,
        interior: 'Here'
      },
      paraId: 1000,
      api: {}
    } as XTransferTransferInput
    const result = getDestination(input)
    expect(result).toEqual(input.recipientAddress)
  })

  it('returns a correct multi-location for Ethereum addresses', () => {
    vi.mocked(ethers.isAddress).mockReturnValue(true)
    const ethAddressInput = {
      recipientAddress: '0x123',
      paraId: 2000,
      api: {}
    } as XTransferTransferInput
    const result = getDestination(ethAddressInput)
    expect(result).toEqual({
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: 2000
          },
          {
            AccountKey20: {
              key: '0x123'
            }
          }
        ]
      }
    })
  })

  it('returns a correct multi-location for non-Ethereum addresses using createAccID', () => {
    vi.mocked(ethers.isAddress).mockReturnValue(false)
    const mockAddress = '0x123'
    vi.mocked(createAccID).mockReturnValue(mockAddress)
    const nonEthAddressInput = {
      recipientAddress: 'someAccountId',
      paraId: 3000,
      api: {}
    } as XTransferTransferInput
    const result = getDestination(nonEthAddressInput)
    expect(result).toEqual({
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: 3000
          },
          {
            AccountId32: {
              id: mockAddress
            }
          }
        ]
      }
    })
    expect(createAccID).toHaveBeenCalledWith(nonEthAddressInput.api, 'someAccountId')
  })
})
