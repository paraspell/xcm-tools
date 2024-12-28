import { describe, it, expect, vi } from 'vitest'
import { ethers } from 'ethers'
import { getDestination } from './getDestination'
import type { TXTransferTransferOptions } from '../../../types'
import type { IPolkadotApi } from '../../../api'

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn()
  }
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
    } as TXTransferTransferOptions<unknown, unknown>
    const result = getDestination(input)
    expect(result).toEqual(input.recipientAddress)
  })

  it('returns a correct multi-location for Ethereum addresses', () => {
    vi.mocked(ethers.isAddress).mockReturnValue(true)
    const ethAddressInput = {
      recipientAddress: '0x123',
      paraId: 2000,
      api: {}
    } as TXTransferTransferOptions<unknown, unknown>
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
    const apiMock = {
      createAccountId: vi.fn().mockReturnValue(mockAddress)
    } as unknown as IPolkadotApi<unknown, unknown>
    const nonEthAddressInput = {
      recipientAddress: 'someAccountId',
      paraId: 3000,
      api: apiMock
    } as unknown as TXTransferTransferOptions<unknown, unknown>

    const accountIdSpy = vi.spyOn(apiMock, 'createAccountId')

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
    expect(accountIdSpy).toHaveBeenCalledWith('someAccountId')
  })
})
