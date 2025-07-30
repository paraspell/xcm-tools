import { describe, expect, it } from 'vitest'

import { CHAIN_NAMES } from '../constants'
import type { TChainWithRelayChains } from '../types'
import { isRelayChain, isSystemChain } from './chain'

describe('isRelayChain', () => {
  it('should return true for Polkadot', () => {
    const result = isRelayChain('Polkadot')
    expect(result).toBe(true)
  })

  it('should return true for Kusama', () => {
    const result = isRelayChain('Kusama')
    expect(result).toBe(true)
  })

  CHAIN_NAMES.forEach(chain => {
    it(`should return false for ${chain}`, () => {
      const result = isRelayChain(chain)
      expect(result).toBe(false)
    })
  })
})

describe('isSystemChain', () => {
  const systemChains: TChainWithRelayChains[] = [
    'AssetHubPolkadot',
    'AssetHubKusama',
    'AssetHubWestend',
    'AssetHubPaseo',
    'BridgeHubPolkadot',
    'BridgeHubKusama',
    'BridgeHubWestend',
    'BridgeHubPaseo',
    'PeoplePolkadot',
    'PeopleKusama',
    'PeopleWestend',
    'PeoplePaseo',
    'CoretimePolkadot',
    'CoretimeKusama',
    'CoretimeWestend',
    'CoretimePaseo',
    'Collectives',
    'CollectivesWestend',
    'Mythos'
  ]

  systemChains.forEach(chain => {
    it(`should return true for ${chain}`, () => {
      const result = isSystemChain(chain)
      expect(result).toBe(true)
    })
  })

  it('should return true for Polkadot', () => {
    const result = isSystemChain('Polkadot')
    expect(result).toBe(true)
  })

  it('should return true for Kusama', () => {
    const result = isSystemChain('Kusama')
    expect(result).toBe(true)
  })

  CHAIN_NAMES.forEach(chain => {
    if (!systemChains.includes(chain)) {
      it(`should return false for ${chain}`, () => {
        const result = isSystemChain(chain)
        expect(result).toBe(false)
      })
    }
  })
})
