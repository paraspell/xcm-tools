import { describe, it, expect, vi, afterEach } from 'vitest'
import { validateDestinationAddress } from './validateDestinationAddress'
import { ethers } from 'ethers'
import { isNodeEvm } from '../../assets'
import { InvalidAddressError } from '../../../errors'
import { isTMultiLocation } from './../utils'
import type { TAddress, TDestination } from '../../../types'

vi.mock('ethers')
vi.mock('../../assets')
vi.mock('../utils')

describe('validateDestinationAddress', () => {
  const mockedIsAddress = vi.mocked(ethers.isAddress)
  const mockedIsNodeEvm = vi.mocked(isNodeEvm)
  const mockedIsTMultiLocation = vi.mocked(isTMultiLocation)

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw an error when destination is EVM and address is a valid Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    const destination: TDestination = 'Moonbeam'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedIsNodeEvm.mockReturnValue(true)
    mockedIsAddress.mockReturnValue(true)

    expect(() => validateDestinationAddress(address, destination)).not.toThrow()

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedIsNodeEvm).toHaveBeenCalledWith(destination)
    expect(mockedIsAddress).toHaveBeenCalledWith(address)
  })

  it('should throw an error when destination is EVM and address is not a valid Ethereum address', () => {
    const address = 'invalid-address'
    const destination: TDestination = 'Moonbeam'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedIsNodeEvm.mockReturnValue(true)
    mockedIsAddress.mockReturnValue(false)

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError)
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.'
    )

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedIsNodeEvm).toHaveBeenCalledWith(destination)
    expect(mockedIsAddress).toHaveBeenCalledWith(address)
  })

  it('should throw an error when destination is not EVM and address is a valid Ethereum address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    const destination: TDestination = 'Acala'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedIsNodeEvm.mockReturnValue(false)
    mockedIsAddress.mockReturnValue(true)

    expect(() => validateDestinationAddress(address, destination)).toThrow(InvalidAddressError)
    expect(() => validateDestinationAddress(address, destination)).toThrow(
      'EVM address provided but destination is not an EVM chain.'
    )

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedIsNodeEvm).toHaveBeenCalledWith(destination)
    expect(mockedIsAddress).toHaveBeenCalledWith(address)
  })

  it('should not throw an error when destination is not EVM and address is not a valid Ethereum address', () => {
    const address = 'some-non-ethereum-address'
    const destination: TDestination = 'Acala'

    mockedIsTMultiLocation.mockReturnValue(false)
    mockedIsNodeEvm.mockReturnValue(false)
    mockedIsAddress.mockReturnValue(false)

    expect(() => validateDestinationAddress(address, destination)).not.toThrow()

    expect(mockedIsTMultiLocation).toHaveBeenCalledWith(destination)
    expect(mockedIsNodeEvm).toHaveBeenCalledWith(destination)
    expect(mockedIsAddress).toHaveBeenCalledWith(address)
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
    expect(mockedIsNodeEvm).not.toHaveBeenCalled()
    expect(mockedIsAddress).not.toHaveBeenCalled()
  })

  it('should not perform validation when destination is undefined', () => {
    const address = 'some-address'
    const destination: TDestination | undefined = undefined

    validateDestinationAddress(address, destination)

    expect(mockedIsTMultiLocation).not.toHaveBeenCalled()
    expect(mockedIsNodeEvm).not.toHaveBeenCalled()
    expect(mockedIsAddress).not.toHaveBeenCalled()
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
    expect(mockedIsNodeEvm).not.toHaveBeenCalled()
    expect(mockedIsAddress).not.toHaveBeenCalled()
  })
})
