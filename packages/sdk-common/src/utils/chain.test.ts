import { describe, expect, it } from 'vitest'

import { EXTERNAL_CHAINS, PARACHAINS, RELAYCHAINS } from '../constants'
import type { TChain } from '../types'
import { isRelayChain, isSystemChain } from './chain'

describe('isRelayChain', () => {
  RELAYCHAINS.forEach(relaychain => {
    it(`should return true for ${relaychain}`, () => {
      const result = isRelayChain(relaychain)
      expect(result).toBe(true)
    })
  })

  PARACHAINS.forEach(parachain => {
    it(`should return false for ${parachain}`, () => {
      const result = isRelayChain(parachain)
      expect(result).toBe(false)
    })
  })

  EXTERNAL_CHAINS.forEach(externalChain => {
    it(`should return false for ${externalChain}`, () => {
      const result = isRelayChain(externalChain)
      expect(result).toBe(false)
    })
  })
})

describe('isSystemChain', () => {
  const systemChains: TChain[] = [
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

  RELAYCHAINS.forEach(relaychain => {
    it(`should return true for relaychain ${relaychain}`, () => {
      const result = isSystemChain(relaychain)
      expect(result).toBe(true)
    })
  })

  PARACHAINS.forEach(chain => {
    if (!systemChains.includes(chain)) {
      it(`should return false for ${chain}`, () => {
        const result = isSystemChain(chain)
        expect(result).toBe(false)
      })
    }
  })

  EXTERNAL_CHAINS.forEach(externalChain => {
    it(`should return false for external chain ${externalChain}`, () => {
      const result = isSystemChain(externalChain)
      expect(result).toBe(false)
    })
  })
})
