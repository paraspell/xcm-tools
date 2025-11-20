import { isTLocation } from '@paraspell/sdk-common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { InvalidAddressError } from '../../errors'
import type { TAddress, TDestination } from '../../types'
import { validateAddress } from '../../utils/validateAddress'
import { validateDestinationAddress } from './validateDestinationAddress'

vi.mock('../../utils/validateAddress', () => ({
  validateAddress: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn()
}))

describe('validateDestinationAddress', () => {
  const mockApi = {} as unknown as IPolkadotApi<unknown, unknown>

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call validateAddress when destination is defined, not a TLocation, and address is a string', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    const destination: TDestination = 'Moonbeam'

    vi.mocked(isTLocation).mockReturnValue(false)

    validateDestinationAddress(address, destination, mockApi)

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, destination, true)
  })

  it('should propagate InvalidAddressError thrown by validateAddress', () => {
    const address = 'invalid-address'
    const destination: TDestination = 'Moonbeam'

    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(validateAddress).mockImplementation(() => {
      throw new InvalidAddressError(
        'Destination chain is an EVM chain, but the address provided is not a valid Ethereum address.'
      )
    })

    expect(() => validateDestinationAddress(address, destination, mockApi)).toThrow(
      InvalidAddressError
    )
    expect(() => validateDestinationAddress(address, destination, mockApi)).toThrow(
      'Destination chain is an EVM chain, but the address provided is not a valid Ethereum address.'
    )

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, destination, true)
  })

  it('should propagate InvalidAddressError when EVM address is provided but destination is not EVM', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    const destination: TDestination = 'Acala'

    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(validateAddress).mockImplementation(() => {
      throw new InvalidAddressError(
        'EVM address provided but destination chain is not an EVM chain.'
      )
    })

    expect(() => validateDestinationAddress(address, destination, mockApi)).toThrow(
      InvalidAddressError
    )
    expect(() => validateDestinationAddress(address, destination, mockApi)).toThrow(
      'EVM address provided but destination chain is not an EVM chain.'
    )

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, destination, true)
  })

  it('should not throw an error when validateAddress succeeds for a non-EVM chain and non-EVM address', () => {
    const address = 'some-non-ethereum-address'
    const destination: TDestination = 'Acala'

    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(validateAddress).mockImplementation(() => {
      // Assume success, no error thrown
    })

    expect(() => validateDestinationAddress(address, destination, mockApi)).not.toThrow()
    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(validateAddress).toHaveBeenCalledWith(mockApi, address, destination, true)
  })

  it('should not perform validation when address is not a string', () => {
    const address: TAddress = {
      parents: 1,
      interior: {
        X1: [
          {
            PalletInstance: '1000'
          }
        ]
      }
    }
    const destination: TDestination = 'Acala'

    validateDestinationAddress(address, destination, mockApi)

    expect(isTLocation).not.toHaveBeenCalled()
    expect(validateAddress).not.toHaveBeenCalled()
  })

  it('should not perform validation when destination is a TLocation', () => {
    const address = 'some-address'
    const destination: TDestination = {
      parents: 1,
      interior: {
        X1: [
          {
            PalletInstance: '1000'
          }
        ]
      }
    }

    vi.mocked(isTLocation).mockReturnValue(true)

    validateDestinationAddress(address, destination, mockApi)

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(validateAddress).not.toHaveBeenCalled()
  })
})
