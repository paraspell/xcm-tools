import type { TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { TChainConfig } from '../../types'
import { getChainConfig } from './getChainConfig'
import { getChainProviders } from './getChainProviders'

vi.mock('./getChainConfig', () => ({
  getChainConfig: vi.fn()
}))

describe('getChainProviders', () => {
  const chainConfig: TChainConfig = {
    name: 'Acala',
    info: 'acala',
    paraId: 2000,
    providers: [
      { name: 'Acala', endpoint: 'https://provider1.com' },
      { name: 'Acala', endpoint: 'https://provider2.com' }
    ]
  }

  it('should return the first provider endpoint when providers are available', () => {
    const mockChain: TSubstrateChain = 'Acala'
    const chainConfig: TChainConfig = {
      name: 'Acala',
      info: 'acala',
      paraId: 2000,
      providers: [
        { name: 'Acala', endpoint: 'https://provider1.com' },
        { name: 'Acala', endpoint: 'https://provider2.com' }
      ]
    }
    vi.mocked(getChainConfig).mockReturnValue(chainConfig)

    const result = getChainProviders(mockChain)
    expect(result).toEqual(['https://provider1.com', 'https://provider2.com'])
    expect(getChainConfig).toHaveBeenCalledWith(mockChain)
  })

  it('should throw an error when no providers are found', () => {
    const mockChain: TSubstrateChain = 'Altair'
    vi.mocked(getChainConfig).mockReturnValue({
      ...chainConfig,
      providers: []
    })

    expect(() => getChainProviders(mockChain)).toThrow(`No providers found for chain ${mockChain}`)
    expect(getChainConfig).toHaveBeenCalledWith(mockChain)
  })

  it('should handle multiple providers correctly and still return the first one', () => {
    const mockChain: TSubstrateChain = 'Astar'
    const mockChainConfig = {
      ...chainConfig,
      providers: [
        { name: 'Acala', endpoint: 'https://providerA.com' },
        { name: 'Acala', endpoint: 'https://providerB.com' },
        { name: 'Acala', endpoint: 'https://providerC.com' }
      ]
    }

    vi.mocked(getChainConfig).mockReturnValue(mockChainConfig)

    const result = getChainProviders(mockChain)
    expect(result).toEqual([
      'https://providerA.com',
      'https://providerB.com',
      'https://providerC.com'
    ])
    expect(getChainConfig).toHaveBeenCalledWith(mockChain)
  })
})
