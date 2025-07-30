import type { TRelaychain } from '@paraspell/sdk-common'
import { isRelayChain, Parents, type TChain, type TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../chains/config'
import { localizeLocation } from './localizeLocation'

vi.mock('../../chains/config')
vi.mock('@paraspell/sdk-common', async () => {
  const actual = await vi.importActual('@paraspell/sdk-common')
  return {
    ...actual,
    isRelayChain: vi.fn()
  }
})

describe('localizeLocation', () => {
  const relaychain: TRelaychain = 'Polkadot'
  const parachain: TChain = 'Acala'

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(isRelayChain).mockImplementation(chain => chain === 'Polkadot' || chain === 'Kusama')

    vi.mocked(getParaId).mockImplementation(chain => {
      if (chain === 'Acala') return 2000
      if (chain === 'Moonbeam') return 2004
      if (chain === 'AssetHubPolkadot') return 1000
      return 0
    })
  })

  describe('interior "Here" handling', () => {
    it('should return interior as "Here" and set parents to 0 if input interior is "Here" and chain is relay chain', () => {
      const input = { parents: 5, interior: 'Here' } as const
      const result = localizeLocation(relaychain, input)
      expect(result.interior).toBe('Here')
      expect(result.parents).toBe(Parents.ZERO)
    })

    it('should keep parents unchanged if input interior is "Here" and chain is not relay chain', () => {
      const input = { parents: 5, interior: 'Here' } as const
      const result = localizeLocation(parachain, input)
      expect(result.interior).toBe('Here')
      expect(result.parents).toBe(5)
    })
  })

  describe('Parachain junction filtering', () => {
    it('should filter out matching Parachain junction and set parents to 0', () => {
      const input: TLocation = {
        parents: 1,
        interior: {
          X3: [{ Parachain: 2000 }, { PalletInstance: 50 }, { GeneralIndex: 50000028 }]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(Parents.ZERO)
      expect(result.interior).toEqual({
        X2: [{ PalletInstance: 50 }, { GeneralIndex: 50000028 }]
      })
    })

    it('should NOT filter out non-matching Parachain junction and keep parents unchanged', () => {
      const input: TLocation = {
        parents: 1,
        interior: {
          X3: [{ Parachain: 3000 }, { PalletInstance: 50 }, { GeneralIndex: 50000028 }]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(1)
      expect(result.interior).toEqual(input.interior)
    })

    it('should return interior as "Here" and set parents to 0 if only junction is matching Parachain', () => {
      const input: TLocation = {
        parents: 2,
        interior: {
          X1: [{ Parachain: 2000 }]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(Parents.ZERO)
      expect(result.interior).toBe('Here')
    })
  })

  describe('no Parachain filtering needed', () => {
    it('should not change anything if no Parachain is present', () => {
      const input: TLocation = {
        parents: 3,
        interior: {
          X2: [{ PalletInstance: 99 }, { GeneralKey: { length: 3, data: 'abc' } }]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(3)
      expect(result.interior).toEqual(input.interior)
    })

    it('should preserve complex junctions when no Parachain matches', () => {
      const input: TLocation = {
        parents: 1,
        interior: {
          X5: [
            { GlobalConsensus: { Polkadot: null } },
            { AccountId32: { id: '0x123', network: null } },
            { PalletInstance: 50 },
            { GeneralIndex: 1 },
            { GeneralKey: { length: 2, data: 'ab' } }
          ]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(1)
      expect(result.interior).toEqual(input.interior)
    })
  })

  describe('relay chain specific behavior', () => {
    it('should handle relay chain with Parachain junction', () => {
      const input: TLocation = {
        parents: 0,
        interior: {
          X2: [{ Parachain: 1000 }, { GeneralIndex: 1 }]
        }
      }
      const result = localizeLocation(relaychain, input)
      expect(result.parents).toBe(0)
      expect(result.interior).toEqual(input.interior)
    })

    it('should set parents to 0 when relay chain processes empty interior result', () => {
      vi.mocked(getParaId).mockReturnValueOnce(1000)

      const input: TLocation = {
        parents: 1,
        interior: {
          X1: [{ Parachain: 1000 }]
        }
      }
      const result = localizeLocation(relaychain, input)
      expect(result.parents).toBe(Parents.ZERO)
      expect(result.interior).toBe('Here')
    })
  })

  describe('edge cases', () => {
    it('should handle X1 with single non-Parachain junction', () => {
      const input: TLocation = {
        parents: 2,
        interior: {
          X1: [{ AccountId32: { id: '0xabc', network: null } }]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(2)
      expect(result.interior).toEqual(input.interior)
    })

    it('should handle deeply nested junction structures', () => {
      const input: TLocation = {
        parents: 1,
        interior: {
          X8: [
            { Parachain: 2000 },
            { PalletInstance: 1 },
            { PalletInstance: 2 },
            { PalletInstance: 3 },
            { PalletInstance: 4 },
            { PalletInstance: 5 },
            { PalletInstance: 6 },
            { GeneralIndex: 7 }
          ]
        }
      }
      const result = localizeLocation(parachain, input)
      expect(result.parents).toBe(Parents.ZERO)
      expect(result.interior).toEqual({
        X7: [
          { PalletInstance: 1 },
          { PalletInstance: 2 },
          { PalletInstance: 3 },
          { PalletInstance: 4 },
          { PalletInstance: 5 },
          { PalletInstance: 6 },
          { GeneralIndex: 7 }
        ]
      })
    })

    it('should handle different chain types correctly', () => {
      // Test with AssetHubPolkadot (paraId 1000)
      const input: TLocation = {
        parents: 1,
        interior: {
          X2: [{ Parachain: 1000 }, { GeneralIndex: 42 }]
        }
      }
      const result = localizeLocation('AssetHubPolkadot', input)
      expect(result.parents).toBe(Parents.ZERO)
      expect(result.interior).toEqual({
        X1: [{ GeneralIndex: 42 }]
      })
    })

    it('should preserve parent count when no changes are made', () => {
      const testCases: TLocation[] = [
        { parents: Parents.ZERO, interior: { X1: [{ GeneralIndex: 1 }] } },
        { parents: Parents.ONE, interior: { X2: [{ PalletInstance: 1 }, { GeneralIndex: 2 }] } },
        { parents: Parents.TWO, interior: { X1: [{ Parachain: 9999 }] } } // Non-matching parachain
      ]

      testCases.forEach(input => {
        const result = localizeLocation(parachain, input)
        expect(result.parents).toBe(input.parents)
      })
    })
  })
})
