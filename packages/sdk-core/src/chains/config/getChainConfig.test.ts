import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { CustomChainInvalidError } from '../../errors'
import type { TFullCustomCtx } from '../../types'
import { getChainConfig, getChainConfigImpl } from './getChainConfig'

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
    Centrifuge: {
      name: 'Centrifuge',
      info: 'centrifuge',
      paraId: 2031,
      providers: []
    },
    Astar: {
      name: 'Astar',
      info: 'astar',
      paraId: 2006,
      providers: [
        { name: 'Astar', endpoint: 'https://providerA.com' },
        { name: 'Astar', endpoint: 'https://providerB.com' }
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
    const chain: TSubstrateChain = 'Centrifuge'
    const result = getChainConfig(chain)

    expect(result).toEqual({
      name: 'Centrifuge',
      info: 'centrifuge',
      paraId: 2031,
      providers: []
    })
    expect(result.providers).toHaveLength(0)
  })

  it('should handle chains with multiple providers', () => {
    const chain: TSubstrateChain = 'Astar'
    const result = getChainConfig(chain)

    expect(result).toEqual({
      name: 'Astar',
      info: 'astar',
      paraId: 2006,
      providers: [
        { name: 'Astar', endpoint: 'https://providerA.com' },
        { name: 'Astar', endpoint: 'https://providerB.com' }
      ]
    })
    expect(result.providers).toHaveLength(2)
  })

  it('builds a config from a registered custom chain entry', () => {
    const ctx: TFullCustomCtx = {
      customChains: {
        MyCustom: {
          name: 'MyCustom',
          paraId: 4242,
          ecosystem: 'Polkadot',
          providers: [{ name: 'rpc', endpoint: 'wss://example' }],
          xcmVersion: Version.V5,
          assets: []
        }
      }
    }

    const result = getChainConfigImpl<'MyCustom'>('MyCustom', ctx)
    expect(result).toEqual({
      name: 'MyCustom',
      info: 'MyCustom',
      paraId: 4242,
      providers: [{ name: 'rpc', endpoint: 'wss://example' }]
    })
  })

  it('throws CustomChainInvalidError when a custom chain is not registered in the ctx', () => {
    expect(() => getChainConfigImpl<'MyCustom'>('MyCustom', {})).toThrow(CustomChainInvalidError)
  })
})
