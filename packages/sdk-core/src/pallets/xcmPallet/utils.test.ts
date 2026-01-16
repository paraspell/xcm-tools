import type { TChain } from '@paraspell/sdk-common'
import {
  isExternalChain,
  isSubstrateBridge,
  Parents,
  type TLocation,
  type TSubstrateChain,
  Version
} from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { RoutingResolutionError } from '../../errors'
import { getRelayChainOf } from '../../utils'
import { createDestination, resolveTChainFromLocation } from './utils'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isSubstrateBridge: vi.fn(),
  isExternalChain: vi.fn()
}))

vi.mock('../../utils', async importActual => ({
  ...(await importActual()),
  getRelayChainOf: vi.fn()
}))

describe('XcmPallet utils', () => {
  describe('createDestination', () => {
    it('creates sub bridge destination location with global consensus', () => {
      const origin: TSubstrateChain = 'BridgeHubPolkadot'
      const destination: TSubstrateChain = 'BridgeHubKusama'
      const chainId = 4000

      vi.mocked(isSubstrateBridge).mockReturnValue(true)
      vi.mocked(isExternalChain).mockReturnValue(false)
      vi.mocked(getRelayChainOf).mockReturnValue('Kusama')

      const location = createDestination(Version.V5, origin, destination, chainId)

      expect(location).toEqual({
        parents: Parents.TWO,
        interior: {
          X2: [{ GlobalConsensus: 'Kusama' }, { Parachain: chainId }]
        }
      })
    })

    it('creates snowbridge destination location with ethereum junction', () => {
      const origin: TSubstrateChain = 'BridgeHubPolkadot'
      const destination: TChain = 'Ethereum'
      const chainId = 1

      vi.mocked(isSubstrateBridge).mockReturnValue(false)
      vi.mocked(isExternalChain).mockReturnValue(false)
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

      const location = createDestination(Version.V5, origin, destination, chainId)

      expect(location).toEqual({
        parents: Parents.TWO,
        interior: {
          X1: [
            {
              GlobalConsensus: { Ethereum: { chainId: BigInt(chainId) } }
            }
          ]
        }
      })
    })
  })

  describe('resolveTChainFromLocation', () => {
    it('should throw RoutingResolutionError if Parachain ID is not found in destination location', () => {
      const locationWithoutParachain: TLocation = {
        parents: Parents.ONE,
        interior: { X1: { AccountKey20: { key: '0x123', network: undefined } } } // No Parachain junction
      }
      expect(() => resolveTChainFromLocation('Kusama', locationWithoutParachain)).toThrow(
        RoutingResolutionError
      )
      expect(() => resolveTChainFromLocation('Kusama', locationWithoutParachain)).toThrow(
        'Parachain ID not found in destination location.'
      )
    })

    it('should throw RoutingResolutionError if chain with specified paraId is not found for the relay chain', () => {
      const locationWithUnknownParaId: TLocation = {
        parents: Parents.ONE,
        interior: { X1: { Parachain: 9999 } }
      }
      expect(() => resolveTChainFromLocation('Kusama', locationWithUnknownParaId)).toThrow(
        RoutingResolutionError
      )
      expect(() => resolveTChainFromLocation('Kusama', locationWithUnknownParaId)).toThrow(
        'Chain with specified paraId not found in destination location.'
      )

      const locationForWrongRelay: TLocation = {
        parents: Parents.ONE,
        interior: { X1: { Parachain: 2004 } }
      }
      expect(() => resolveTChainFromLocation('Kusama', locationForWrongRelay)).toThrow(
        RoutingResolutionError
      )
      expect(() => resolveTChainFromLocation('Kusama', locationForWrongRelay)).toThrow(
        'Chain with specified paraId not found in destination location.'
      )
    })
  })
})
