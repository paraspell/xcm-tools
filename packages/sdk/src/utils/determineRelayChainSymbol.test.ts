import { describe, it, expect, vi } from 'vitest'
import { TNodeWithRelayChains } from '../types'
import { determineRelayChainSymbol } from './determineRelayChainSymbol'
import { getRelayChainSymbol } from '../pallets/assets'

vi.mock('../pallets/assets', () => ({
  getRelayChainSymbol: vi.fn()
}))

describe('determineRelayChainSymbol', () => {
  it('should return "DOT" for Polkadot', () => {
    const node = 'Polkadot' as TNodeWithRelayChains
    const result = determineRelayChainSymbol(node)
    expect(result).toBe('DOT')
  })

  it('should return "KSM" for Kusama', () => {
    const node = 'Kusama' as TNodeWithRelayChains
    const result = determineRelayChainSymbol(node)
    expect(result).toBe('KSM')
  })

  it('should return the result of getRelayChainSymbol for other nodes', () => {
    const node = 'SomeOtherNode' as TNodeWithRelayChains
    const relayChainSymbolMock = 'DOT'

    vi.mocked(getRelayChainSymbol).mockReturnValue(relayChainSymbolMock)

    const result = determineRelayChainSymbol(node)

    expect(result).toBe(relayChainSymbolMock)
    expect(getRelayChainSymbol).toHaveBeenCalledWith(node)
  })
})
