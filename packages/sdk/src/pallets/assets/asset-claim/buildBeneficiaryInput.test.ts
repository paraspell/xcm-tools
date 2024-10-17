import { describe, it, expect, vi } from 'vitest'
import { buildBeneficiaryInput } from './buildBeneficiaryInput'
import { ethers } from 'ethers'
import { Parents } from '../../../types'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn()
  }
}))

vi.mock('../../../utils', () => ({
  createAccountId: vi.fn()
}))

describe('buildBeneficiaryInput', () => {
  const apiMock = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

  it('should return the address if it is a TMultiLocation', () => {
    const multiLocation = {
      parents: Parents.ONE,
      interior: {}
    }
    const result = buildBeneficiaryInput(apiMock, multiLocation)
    expect(result).toBe(multiLocation)
  })

  it('should return AccountKey20 if the address is an Ethereum address', () => {
    const ethAddress = '0x1234567890abcdef1234567890abcdef12345678'
    vi.mocked(ethers.isAddress).mockReturnValue(true)

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
    vi.mocked(ethers.isAddress).mockReturnValue(false)

    const accountSpy = vi.spyOn(apiMock, 'createAccountId').mockReturnValue(accountId32)

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
