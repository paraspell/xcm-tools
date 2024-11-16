import { describe, it, expect, vi } from 'vitest'
import { getNodeProvider } from './getNodeProvider'
import { getNodeConfig } from './getNodeConfig'
import type { TNodeConfig, TNodeDotKsmWithRelayChains } from '../../types'

vi.mock('./getNodeConfig', () => ({
  getNodeConfig: vi.fn()
}))

describe('getNodeProvider', () => {
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
    const mockNode: TNodeDotKsmWithRelayChains = 'Zeitgeist'
    const nodeConfig: TNodeConfig = {
      name: 'Zeitgeist',
      info: 'zeitgeist',
      paraId: 2000,
      providers: [
        { name: 'Zeitgeist', endpoint: 'https://provider1.com' },
        { name: 'Zeitgeist', endpoint: 'https://provider2.com' }
      ]
    }
    vi.mocked(getNodeConfig).mockReturnValue(nodeConfig)

    const result = getNodeProvider(mockNode)
    expect(result).toBe('https://provider1.com')
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })

  it('should throw an error when no providers are found', () => {
    const mockNode: TNodeDotKsmWithRelayChains = 'Altair'
    vi.mocked(getNodeConfig).mockReturnValue({
      ...nodeConfig,
      providers: []
    })

    expect(() => getNodeProvider(mockNode)).toThrowError(`No providers found for node ${mockNode}`)
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

    const result = getNodeProvider(mockNode)
    expect(result).toBe('https://providerA.com')
    expect(getNodeConfig).toHaveBeenCalledWith(mockNode)
  })
})
