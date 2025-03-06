import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvalidAddressError } from '../../errors'
import { isTMultiLocation } from '../../pallets/xcmPallet/utils'
import type { TAddress, TDestination } from '../../types'
import { validateAddress } from '../../utils/validateAddress'
import { validateDestinationAddress } from './validateDestinationAddress'

vi.mock('../../utils/validateAddress', () => ({
  validateAddress: vi.fn()
}))
vi.mock('../../pallets/xcmPallet/utils', () => ({
  isTMultiLocation: vi.fn()
}))

describe('validateDestinationAddress', () => {
  const mockedValidateAddress = vi.mocked(validateAddress)
  const mockedIsTMultiLocation = vi.mocked(isTMultiLocation)

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call validateAddress when destination is defined, not a TMultiLocation, and address is a string', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    const destination: TDestination = 'Moonbeam'

    mockedIsTMultiLocation.mockReturnValue(false)

    validateDestinationAddress(address, destination)

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedValidateAddress).toHaveBeenCalledWith(address, destination)
  })

  it('should propagate InvalidAddressError thrown by validateAddress', () => {
    const address = 'invalid-address'
    const destination: TDestination = 'Moonbeam'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedValidateAddress.mockImplementation(() => {
      throw new InvalidAddressError(
        'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.'
      )
    })

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError)
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.'
    )

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedValidateAddress).toHaveBeenCalledWith(address, destination)
  })

  it('should propagate InvalidAddressError when EVM address is provided but destination is not EVM', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    const destination: TDestination = 'Acala'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedValidateAddress.mockImplementation(() => {
      throw new InvalidAddressError(
        'EVM address provided but destination node is not an EVM chain.'
      )
    })

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError)
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'EVM address provided but destination node is not an EVM chain.'
    )

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedValidateAddress).toHaveBeenCalledWith(address, destination)
  })

  it('should not throw an error when validateAddress succeeds for a non-EVM chain and non-EVM address', () => {
    const address = 'some-non-ethereum-address'
    const destination: TDestination = 'Acala'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedValidateAddress.mockImplementation(() => {
      // Assume success, no error thrown
    })

    expect(() => validateDestinationAddress(address, destination)).not.toThrow()
    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedValidateAddress).toHaveBeenCalledWith(address, destination)
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

    validateDestinationAddress(address, destination)

    expect(mockedIsTMultiLocation).not.toHaveBeenCalled()
    expect(mockedValidateAddress).not.toHaveBeenCalled()
  })

  it('should not perform validation when destination is a TMultiLocation', () => {
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

    mockedIsTMultiLocation.mockReturnValue(true)

    validateDestinationAddress(address, destination)

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedValidateAddress).not.toHaveBeenCalled()
  })
})
