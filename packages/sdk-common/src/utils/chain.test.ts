import { describe, expect, it } from 'vitest'

import { EXTERNAL_CHAINS, PARACHAINS, RELAYCHAINS } from '../constants'
import type { TChain } from '../types'
import { isExternalChain, isRelayChain, isSystemChain, isTrustedChain } from './chain'

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

describe('isExternalChain', () => {
  EXTERNAL_CHAINS.forEach(externalChain => {
    it(`should return true for ${externalChain}`, () => {
      const result = isExternalChain(externalChain)
      expect(result).toBe(true)
    })
  })

  PARACHAINS.forEach(parachain => {
    it(`should return false for ${parachain}`, () => {
      const result = isExternalChain(parachain)
      expect(result).toBe(false)
    })
  })

  RELAYCHAINS.forEach(relaychain => {
    it(`should return false for ${relaychain}`, () => {
      const result = isExternalChain(relaychain)
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
    'CollectivesWestend'
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

  describe('isTrustedChain', () => {
    const trustedByAh = new Set<TChain>(['Mythos', 'Encointer'])

    it('should return true for Mythos and Encointer', () => {
      expect(isTrustedChain('Mythos')).toBe(true)
      expect(isTrustedChain('Encointer')).toBe(true)
    })

    systemChains.forEach(chain => {
      it(`should return true for system chain ${chain}`, () => {
        expect(isTrustedChain(chain)).toBe(true)
      })
    })

    RELAYCHAINS.forEach(relaychain => {
      it(`should return true for relaychain ${relaychain}`, () => {
        expect(isTrustedChain(relaychain)).toBe(true)
      })
    })

    PARACHAINS.forEach(chain => {
      if (!systemChains.includes(chain) && !trustedByAh.has(chain)) {
        it(`should return false for parachain ${chain}`, () => {
          expect(isTrustedChain(chain)).toBe(false)
        })
      }
    })

    EXTERNAL_CHAINS.forEach(externalChain => {
      it(`should return false for external chain ${externalChain}`, () => {
        expect(isTrustedChain(externalChain)).toBe(false)
      })
    })
  })
})
