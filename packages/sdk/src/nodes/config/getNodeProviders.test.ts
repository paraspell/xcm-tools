import { describe, it, expect, vi } from 'vitest'
import { getNodeConfig } from './getNodeConfig'
import type { TNodeConfig, TNodeDotKsmWithRelayChains } from '../../types'
import { getNodeProviders } from './getNodeProviders'

vi.mock('./getNodeConfig', () => ({
  getNodeConfig: vi.fn()
}))

describe('getNodeProviders', () => {
  const nodeConfig: TNodeConfig = {
    name: 'Acala',
    info: 'acala',
    paraId: 2000,
    providers: [
      { name: 'Acala', endpoint: 'https://provider1.com' },
      { name: 'Acala', endpoint: 'https://provider2.com' }
    ]
  }

  it('should return the first provider endpoint when providers are available', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Acala'
    const nodeConfig: TNodeConfig = {
      name: 'Acala',
      info: 'acala',
      paraId: 2000,
      providers: [
        { name: 'Acala', endpoint: 'https://provider1.com' },
        { name: 'Acala', endpoint: 'https://provider2.com' }
      ]
    }
    vi.mocked(getNodeConfig).mockReturnValue(nodeConfig)

    const result = getNodeProviders(mockNode)
    expect(result).toEqual(['https://provider1.com', 'https://provider2.com'])
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })

  it('should throw an error when no providers are found', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Altair'
    vi.mocked(getNodeConfig).mockReturnValue({
      ...nodeConfig,
      providers: []
    })

    expect(() => getNodeProviders(mockNode)).toThrowError(`No providers found for node ${mockNode}`)
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })

  it('should handle multiple providers correctly and still return the first one', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Amplitude'
    const mockNodeConfig = {
      ...nodeConfig,
      providers: [
        { name: 'Acala', endpoint: 'https://providerA.com' },
        { name: 'Acala', endpoint: 'https://providerB.com' },
        { name: 'Acala', endpoint: 'https://providerC.com' }
      ]
    }

    vi.mocked(getNodeConfig).mockReturnValue(mockNodeConfig)

    const result = getNodeProviders(mockNode)
    expect(result).toEqual([
      'https://providerA.com',
      'https://providerB.com',
      'https://providerC.com'
    ])
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })
})
