import { isChainEvm } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw when address is a TLocation', () => {
    const address: TAddress = { parents: 0, interior: { X1: { Parachain: 100 } } }
    const chain: TChain = 'Polkadot'

    expect(() => validateAddress(address, chain)).not.toThrow()
  })

  it('should not throw when chain is EVM and address is a valid Ethereum address', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const chain: TChain = 'Moonbeam'

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(address, chain)).not.toThrow()
  })

  it('should throw InvalidAddressError when chain is EVM and address is not a valid Ethereum address', () => {
    const address: TAddress = 'invalid-address'
    const chain: TChain = 'Moonbeam'

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(address, chain)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, chain)).toThrow(
      'Destination chain is an EVM chain, but the address provided is not a valid Ethereum address.'
    )
  })

  it('should not throw when chain is non-EVM and address is not a valid Ethereum address', () => {
    const address: TAddress = 'some-non-ethereum-address'
    const chain: TChain = 'Acala'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(address, chain)).not.toThrow()
  })

  it('should throw InvalidAddressError when chain is non-EVM and address is a valid Ethereum address', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const chain: TChain = 'Polkadot'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(address, chain)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, chain)).toThrow(
      'EVM address provided but destination chain is not an EVM chain.'
    )
  })

  it('should customize the error message when isDestination is false and chain is EVM and address is invalid', () => {
    const address: TAddress = 'invalid-address'
    const chain: TChain = 'Moonbeam'

    vi.mocked(isChainEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(address, chain, false)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, chain, false)).toThrow(
      'Chain is an EVM chain, but the address provided is not a valid Ethereum address.'
    )
  })

  it('should customize the error message when isDestination is false and chain is non-EVM and address is valid', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const chain: TChain = 'Polkadot'

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(address, chain, false)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, chain, false)).toThrow(
      'EVM address provided but chain is not an EVM chain.'
    )
  })
})
