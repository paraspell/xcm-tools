import { isChainEvm } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { InvalidAddressError } from '../errors'
import type { TAddress } from '../types'
import { validateAddress } from './validateAddress'

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isChainEvm: vi.fn()
}))

describe('validateAddress', () => {
  const mockApi = {
    validateSubstrateAddress: vi.fn().mockReturnValue(true)
  } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw when address is a TLocation', () => {
    const address: TAddress = { parents: 0, interior: { X1: { Parachain: 100 } } }
    const chain: TChain = 'Polkadot'

    expect(() => validateAddress(mockApi, address, chain)).not.toThrow()
  })

  it('should not throw when chain is EVM and address is a valid Ethereum address', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const chain: TChain = 'Moonbeam'

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(mockApi, address, chain)).not.toThrow()
  })

  it('should throw InvalidAddressError when chain is EVM and address is not a valid Ethereum address', () => {
    const address: TAddress = 'invalid-address'
    const chain: TChain = 'Moonbeam'

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(mockApi, address, chain)).toThrow(InvalidAddressError)
    expect(() => validateAddress(mockApi, address, chain)).toThrow(
      'Destination chain is an EVM chain, but the address provided is not a valid Ethereum address.'
    )
  })

  it('should not throw when chain is non-EVM and address is not a valid Ethereum address', () => {
    const address: TAddress = 'some-non-ethereum-address'
    const chain: TChain = 'Acala'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(mockApi, address, chain)).not.toThrow()
  })

  it('should throw InvalidAddressError when chain is non-EVM and address is a valid Ethereum address', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const chain: TChain = 'Polkadot'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(mockApi, address, chain)).toThrow(InvalidAddressError)
    expect(() => validateAddress(mockApi, address, chain)).toThrow(
      'EVM address provided but destination chain is not an EVM chain.'
    )
  })

  it('should customize the error message when isDestination is false and chain is EVM and address is invalid', () => {
    const address: TAddress = 'invalid-address'
    const chain: TChain = 'Moonbeam'

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(mockApi, address, chain, false)).toThrow(InvalidAddressError)
    expect(() => validateAddress(mockApi, address, chain, false)).toThrow(
      'Chain is an EVM chain, but the address provided is not a valid Ethereum address.'
    )
  })

  it('should customize the error message when isDestination is false and chain is non-EVM and address is valid', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const chain: TChain = 'Polkadot'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(mockApi, address, chain, false)).toThrow(InvalidAddressError)
    expect(() => validateAddress(mockApi, address, chain, false)).toThrow(
      'EVM address provided but chain is not an EVM chain.'
    )
  })

  it('should skip validation for public key format (0x prefix but not EVM address)', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
    const chain: TChain = 'Polkadot'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(mockApi, address, chain)).not.toThrow()
  })

  it('should validate Substrate address when API is provided and address is valid', () => {
    const address: TAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmst2oT29E5c9F7NYtiLP'
    const chain: TChain = 'Polkadot'
    const mockApi = {
      validateSubstrateAddress: vi.fn().mockReturnValue(true)
    } as unknown as IPolkadotApi<unknown, unknown>

    const validateSpy = vi.spyOn(mockApi, 'validateSubstrateAddress')

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(mockApi, address, chain, true)).not.toThrow()
    expect(validateSpy).toHaveBeenCalledWith(address)
  })

  it('should throw InvalidAddressError when API is provided and Substrate address is invalid', () => {
    const address: TAddress = 'invalid-address'
    const chain: TChain = 'Polkadot'
    const invalidApi = {
      validateSubstrateAddress: vi.fn().mockReturnValue(false)
    } as unknown as IPolkadotApi<unknown, unknown>

    const validateSpy = vi.spyOn(invalidApi, 'validateSubstrateAddress')

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(invalidApi, address, chain, true)).toThrow(InvalidAddressError)
    expect(() => validateAddress(invalidApi, address, chain, true)).toThrow(
      'Invalid address: invalid-address'
    )
    expect(validateSpy).toHaveBeenCalledWith(address)
  })

  it('should throw InvalidAddressError for invalid address that causes getSs58AddressInfo to throw (bug scenario)', () => {
    const address: TAddress = 'invalid-address'
    const chain: TChain = 'Polkadot'
    const invalidApi = {
      validateSubstrateAddress: vi.fn().mockReturnValue(false)
    } as unknown as IPolkadotApi<unknown, unknown>

    const validateSpy = vi.spyOn(invalidApi, 'validateSubstrateAddress')

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(invalidApi, address, chain, true)).toThrow(InvalidAddressError)
    expect(() => validateAddress(invalidApi, address, chain, true)).toThrow(
      'Invalid address: invalid-address'
    )
    expect(validateSpy).toHaveBeenCalledWith(address)

    try {
      validateAddress(invalidApi, address, chain, true)
      expect.fail('Should have thrown InvalidAddressError')
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAddressError)
      expect((error as InvalidAddressError).constructor.name).toBe('InvalidAddressError')
    }
  })
})
