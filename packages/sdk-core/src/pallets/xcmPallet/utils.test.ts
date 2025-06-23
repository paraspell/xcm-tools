import type { TMultiLocation } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { resolveTNodeFromMultiLocation } from './utils'

describe('XcmPallet utils', () => {
  describe('resolveTNodeFromMultiLocation', () => {
    it('should throw InvalidParameterError if Parachain ID is not found in destination multiLocation', () => {
      const multiLocationWithoutParachain: TMultiLocation = {
        parents: Parents.ONE,
        interior: { X1: { AccountKey20: { key: '0x123', network: undefined } } } // No Parachain junction
      }
      expect(() =>
        resolveTNodeFromMultiLocation('Kusama', multiLocationWithoutParachain)
      ).toThrowError(InvalidParameterError)
      expect(() =>
        resolveTNodeFromMultiLocation('Kusama', multiLocationWithoutParachain)
      ).toThrowError('Parachain ID not found in destination multi-location.')
    })

    it('should throw InvalidParameterError if node with specified paraId is not found for the relay chain', () => {
      const multiLocationWithUnknownParaId: TMultiLocation = {
        parents: Parents.ONE,
        interior: { X1: { Parachain: 9999 } }
      }
      expect(() =>
        resolveTNodeFromMultiLocation('Kusama', multiLocationWithUnknownParaId)
      ).toThrowError(InvalidParameterError)
      expect(() =>
        resolveTNodeFromMultiLocation('Kusama', multiLocationWithUnknownParaId)
      ).toThrowError('Node with specified paraId not found in destination multi location.')

      const multiLocationForWrongRelay: TMultiLocation = {
        parents: Parents.ONE,
        interior: { X1: { Parachain: 2004 } }
      }
      expect(() =>
        resolveTNodeFromMultiLocation('Kusama', multiLocationForWrongRelay)
      ).toThrowError(InvalidParameterError)
      expect(() =>
        resolveTNodeFromMultiLocation('Kusama', multiLocationForWrongRelay)
      ).toThrowError('Node with specified paraId not found in destination multi location.')
    })
  })
})
