import { Parents } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { buildBeneficiaryInput } from './buildBeneficiaryInput'

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

vi.mock('../../../utils', () => ({
  createAccountId: vi.fn()
}))

describe('buildBeneficiaryInput', () => {
  const apiMock = {
    accountToHex: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('should return the address if it is a TLocation', () => {
    const location = {
      parents: Parents.ONE,
      interior: {}
    }
    const result = buildBeneficiaryInput(apiMock, location)
    expect(result).toBe(location)
  })

  it('should return AccountKey20 if the address is an Ethereum address', () => {
    const ethAddress = '0x1234567890abcdef1234567890abcdef12345678'
    vi.mocked(isAddress).mockReturnValue(true)

    const result = buildBeneficiaryInput(apiMock, ethAddress)

    expect(result).toEqual({
      parents: Parents.ZERO,
      interior: {
        X1: {
          AccountKey20: {
            key: ethAddress
          }
        }
      }
    })
  })

  it('should return AccountId32 if the address is not an Ethereum address', () => {
    const nonEthAddress = 'somePolkadotAddress'
    const accountId32 = '0xabcdef'
    vi.mocked(isAddress).mockReturnValue(false)

    const accountSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accountId32)

    const result = buildBeneficiaryInput(apiMock, nonEthAddress)

    expect(result).toEqual({
      parents: Parents.ZERO,
      interior: {
        X1: {
          AccountId32: {
            id: accountId32
          }
        }
      }
    })
    expect(accountSpy).toHaveBeenCalledWith(nonEthAddress)
  })
})
