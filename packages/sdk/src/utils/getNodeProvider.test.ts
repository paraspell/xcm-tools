import { describe, it, expect, vi } from 'vitest'
import { TNodeWithRelayChains } from '../types'
import { getNode, getNodeProvider } from '.'

vi.mock('@polkadot/apps-config', () => ({
  prodRelayPolkadot: { providers: ['https://polkadotProvider.com'] },
  prodRelayKusama: { providers: ['https://kusamaProvider.com'] }
}))

vi.mock('./getNode', () => ({
  getNode: vi.fn().mockReturnValue({
    getProvider: () => 'https://otherNodeProvider.com'
  })
}))

describe('getNodeProvider', () => {
  it('should return the first provider for Polkadot', () => {
    const node = 'Polkadot' as TNodeWithRelayChains
    const result = getNodeProvider(node)
    expect(result).toBe('https://polkadotProvider.com')
  })

  it('should return the first provider for Kusama', () => {
    const node = 'Kusama' as TNodeWithRelayChains
    const result = getNodeProvider(node)
    expect(result).toBe('https://kusamaProvider.com')
  })

  it('should call getNode and return the provider for other nodes', () => {
    const node = 'SomeOtherNode' as TNodeWithRelayChains
    const mockNodeProvider = 'https://otherNodeProvider.com'

    const result = getNodeProvider(node)
    expect(result).toBe(mockNodeProvider)
    expect(getNode).toHaveBeenCalledWith(node)
  })
})
