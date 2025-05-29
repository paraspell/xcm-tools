import { isNodeEvm } from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidAddressError } from '../errors'
import type { TAddress } from '../types'
import { validateAddress } from './validateAddress'

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isNodeEvm: vi.fn()
}))

describe('validateAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw when address is a TMultiLocation', () => {
    const address: TAddress = { parents: 0, interior: { X1: { Parachain: 100 } } }
    const node: TNodeWithRelayChains = 'Polkadot'

    expect(() => validateAddress(address, node)).not.toThrow()
  })

  it('should not throw when node is EVM and address is a valid Ethereum address', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const node: TNodeWithRelayChains = 'Moonbeam'

    vi.mocked(isNodeEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(address, node)).not.toThrow()
  })

  it('should throw InvalidAddressError when node is EVM and address is not a valid Ethereum address', () => {
    const address: TAddress = 'invalid-address'
    const node: TNodeWithRelayChains = 'Moonbeam'

    vi.mocked(isNodeEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(address, node)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, node)).toThrow(
      'Destination node is an EVM chain, but the address provided is not a valid Ethereum address.'
    )
  })

  it('should not throw when node is non-EVM and address is not a valid Ethereum address', () => {
    const address: TAddress = 'some-non-ethereum-address'
    const node: TNodeWithRelayChains = 'Acala'

    vi.mocked(isNodeEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(address, node)).not.toThrow()
  })

  it('should throw InvalidAddressError when node is non-EVM and address is a valid Ethereum address', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const node: TNodeWithRelayChains = 'Polkadot'

    vi.mocked(isNodeEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(address, node)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, node)).toThrow(
      'EVM address provided but destination node is not an EVM chain.'
    )
  })

  it('should customize the error message when isDestination is false and node is EVM and address is invalid', () => {
    const address: TAddress = 'invalid-address'
    const node: TNodeWithRelayChains = 'Moonbeam'

    vi.mocked(isNodeEvm).mockReturnValue(true)
    vi.mocked(isAddress).mockReturnValue(false)

    expect(() => validateAddress(address, node, false)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, node, false)).toThrow(
      'Node is an EVM chain, but the address provided is not a valid Ethereum address.'
    )
  })

  it('should customize the error message when isDestination is false and node is non-EVM and address is valid', () => {
    const address: TAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const node: TNodeWithRelayChains = 'Polkadot'

    vi.mocked(isNodeEvm).mockReturnValue(false)
    vi.mocked(isAddress).mockReturnValue(true)

    expect(() => validateAddress(address, node, false)).toThrow(InvalidAddressError)
    expect(() => validateAddress(address, node, false)).toThrow(
      'EVM address provided but node is not an EVM chain.'
    )
  })
})
