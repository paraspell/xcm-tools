import type { TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getChainConfig } from './getChainConfig'

vi.mock('../../maps/configs.json', () => ({
  default: {
    Acala: {
      name: 'Acala',
      info: 'acala',
      paraId: 2000,
      providers: [
        { name: 'Acala', endpoint: 'https://provider1.com' },
        { name: 'Acala', endpoint: 'https://provider2.com' }
      ]
    },
    Altair: {
      name: 'Altair',
      info: 'altair',
      paraId: 2088,
      providers: []
    },
    Amplitude: {
      name: 'Amplitude',
      info: 'amplitude',
      paraId: 2015,
      providers: [
        { name: 'Amplitude', endpoint: 'https://providerA.com' },
        { name: 'Amplitude', endpoint: 'https://providerB.com' }
      ]
    }
  }
}))

describe('getChainConfig', () => {
  it('should return the correct config for a valid chain', () => {
    const chain: TSubstrateChain = 'Acala'
    const result = getChainConfig(chain)

    expect(result).toEqual({
      name: 'Acala',
      info: 'acala',
      paraId: 2000,
      providers: [
        { name: 'Acala', endpoint: 'https://provider1.com' },
        { name: 'Acala', endpoint: 'https://provider2.com' }
      ]
    })
  })

  it('should return the correct config when providers are empty', () => {
    const chain: TSubstrateChain = 'Altair'
    const result = getChainConfig(chain)

    expect(result).toEqual({
      name: 'Altair',
      info: 'altair',
      paraId: 2088,
      providers: []
    })
    expect(result.providers).toHaveLength(0)
  })

  it('should handle chains with multiple providers', () => {
    const chain: TSubstrateChain = 'Amplitude'
    const result = getChainConfig(chain)

    expect(result).toEqual({
      name: 'Amplitude',
      info: 'amplitude',
      paraId: 2015,
      providers: [
        { name: 'Amplitude', endpoint: 'https://providerA.com' },
        { name: 'Amplitude', endpoint: 'https://providerB.com' }
      ]
    })
    expect(result.providers).toHaveLength(2)
  })
})
