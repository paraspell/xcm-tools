import {
  isExternalChain,
  isSubstrateBridge,
  Parents,
  type TLocation,
  type TSubstrateChain,
  Version
} from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { getRelayChainOf } from '../../utils'
import { createDestination, resolveTChainFromLocation } from './utils'

vi.mock('@paraspell/sdk-common', async importActual => {
  const actual = await importActual<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    isSubstrateBridge: vi.fn(),
    isExternalChain: vi.fn()
  }
})

vi.mock('../../utils', async importActual => {
  const actual = await importActual<typeof import('../../utils')>()
  return {
    ...actual,
    getRelayChainOf: vi.fn(actual.getRelayChainOf)
  }
})

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
  })

  describe('resolveTChainFromLocation', () => {
    it('should throw InvalidParameterError if Parachain ID is not found in destination location', () => {
      const locationWithoutParachain: TLocation = {
        parents: Parents.ONE,
        interior: { X1: { AccountKey20: { key: '0x123', network: undefined } } } // No Parachain junction
      }
      expect(() => resolveTChainFromLocation('Kusama', locationWithoutParachain)).toThrowError(
        InvalidParameterError
      )
      expect(() => resolveTChainFromLocation('Kusama', locationWithoutParachain)).toThrowError(
        'Parachain ID not found in destination location.'
      )
    })

    it('should throw InvalidParameterError if chain with specified paraId is not found for the relay chain', () => {
      const locationWithUnknownParaId: TLocation = {
        parents: Parents.ONE,
        interior: { X1: { Parachain: 9999 } }
      }
      expect(() => resolveTChainFromLocation('Kusama', locationWithUnknownParaId)).toThrowError(
        InvalidParameterError
      )
      expect(() => resolveTChainFromLocation('Kusama', locationWithUnknownParaId)).toThrowError(
        'Chain with specified paraId not found in destination location.'
      )

      const locationForWrongRelay: TLocation = {
        parents: Parents.ONE,
        interior: { X1: { Parachain: 2004 } }
      }
      expect(() => resolveTChainFromLocation('Kusama', locationForWrongRelay)).toThrowError(
        InvalidParameterError
      )
      expect(() => resolveTChainFromLocation('Kusama', locationForWrongRelay)).toThrowError(
        'Chain with specified paraId not found in destination location.'
      )
    })
  })
})
