import type { TLocation } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { resolveTChainFromLocation } from './utils'

describe('XcmPallet utils', () => {
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
