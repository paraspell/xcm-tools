import { Parents } from '@paraspell/sdk-common'
import * as ethers from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import type { TAddress } from '../types'
import { Version } from '../types'
import { generateAddressMultiLocationV4 } from './generateAddressMultiLocationV4'

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn()
  }
}))

describe('generateAddressMultiLocationV4', () => {
  let apiMock: IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    apiMock = {
      accountToHex: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>
  })

  it('should return a multi-location object when the address is a multi-location object', () => {
    const multiLocationAddress: TAddress = { parents: Parents.ONE, interior: {} }
    const result = generateAddressMultiLocationV4(apiMock, multiLocationAddress)

    expect(result).toEqual({ [Version.V4]: multiLocationAddress })
  })

  it('should return a multi-location object with AccountKey20 when the address is a valid Ethereum address', () => {
    const ethAddress = '0x1234567890123456789012345678901234567890'
    vi.mocked(ethers.ethers.isAddress).mockReturnValue(true)

    const result = generateAddressMultiLocationV4(apiMock, ethAddress)

    expect(result).toEqual({
      [Version.V4]: {
        parents: Parents.ZERO,
        interior: {
          X1: [{ AccountKey20: { key: ethAddress } }]
        }
      }
    })
  })

  it('should return a multi-location object with AccountId32 when the address is not an Ethereum address', () => {
    const standardAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
    vi.mocked(ethers.ethers.isAddress).mockReturnValue(false)
    const accIDMock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)

    const result = generateAddressMultiLocationV4(apiMock, standardAddress)

    expect(result).toEqual({
      [Version.V4]: {
        parents: Parents.ZERO,
        interior: {
          X1: [{ AccountId32: { id: accIDMock, network: null } }]
        }
      }
    })

    expect(accountIdSpy).toHaveBeenCalledWith(standardAddress)
  })

  it('should handle invalid Ethereum address appropriately', () => {
    const invalidEthAddress = '0xinvalidEthAddress'
    vi.mocked(ethers.ethers.isAddress).mockReturnValue(false)
    const accIDMock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)

    const result = generateAddressMultiLocationV4(apiMock, invalidEthAddress)

    expect(result).toEqual({
      [Version.V4]: {
        parents: Parents.ZERO,
        interior: {
          X1: [{ AccountId32: { id: accIDMock, network: null } }]
        }
      }
    })

    expect(accountIdSpy).toHaveBeenCalledWith(invalidEthAddress)
  })
})
