import { describe, expect, it } from 'vitest'

import { NODE_NAMES } from '../constants'
import type { TNodeWithRelayChains } from '../types'
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

  NODE_NAMES.forEach(node => {
    it(`should return false for ${node}`, () => {
      const result = isRelayChain(node)
      expect(result).toBe(false)
    })
  })
})

describe('isSystemChain', () => {
  const systemChains: TNodeWithRelayChains[] = [
    'AssetHubPolkadot',
    'AssetHubKusama',
    'BridgeHubPolkadot',
    'BridgeHubKusama',
    'PeoplePolkadot',
    'PeopleKusama',
    'Mythos'
  ]

  systemChains.forEach(chain => {
    it(`should return true for ${chain}`, () => {
      const result = isSystemChain(chain)
      expect(result).toBe(true)
    })
  })

  it('should return false for Polkadot', () => {
    const result = isSystemChain('Polkadot')
    expect(result).toBe(false)
  })

  it('should return false for Kusama', () => {
    const result = isSystemChain('Kusama')
    expect(result).toBe(false)
  })

  NODE_NAMES.forEach(node => {
    if (!systemChains.includes(node)) {
      it(`should return false for ${node}`, () => {
        const result = isSystemChain(node)
        expect(result).toBe(false)
      })
    }
  })
})
