import type { TMultiLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import type { TCreateBeneficiaryOptions } from '../types'
import { addXcmVersionHeader } from './addXcmVersionHeader'
import { createBeneficiary, createVersionedBeneficiary } from './createBeneficiary'
import { createBeneficiaryMultiLocation } from './multiLocation'

vi.mock('./multiLocation', () => ({
  createBeneficiaryMultiLocation: vi.fn()
}))

vi.mock('./addXcmVersionHeader', () => ({
  addXcmVersionHeader: vi.fn()
}))

describe('Beneficiary Creation', () => {
  const mockMultiLocation = {} as TMultiLocation

  describe('createBeneficiary', () => {
    it('should call createBeneficiaryMultiLocation with the provided options', () => {
      const mockOptions = {
        api: {} as IPolkadotApi<unknown, unknown>,
        paraId: 1000,
        version: Version.V4
      } as TCreateBeneficiaryOptions<unknown, unknown>

      vi.mocked(createBeneficiaryMultiLocation).mockReturnValue(mockMultiLocation)

      const result = createBeneficiary(mockOptions)

      expect(createBeneficiaryMultiLocation).toHaveBeenCalledWith(mockOptions)
      expect(result).toEqual(mockMultiLocation)
    })
  })

  describe('createVersionedBeneficiary', () => {
    it('should create a beneficiary and then add a version header', () => {
      const version = Version.V4

      const mockOptions = {
        api: {} as IPolkadotApi<unknown, unknown>,
        paraId: 1000,
        version
      } as TCreateBeneficiaryOptions<unknown, unknown>

      const versionedMultiLocation = { location: 'versioned', version }

      vi.mocked(createBeneficiaryMultiLocation).mockReturnValue(mockMultiLocation)
      vi.mocked(addXcmVersionHeader).mockReturnValue(versionedMultiLocation)

      const result = createVersionedBeneficiary(mockOptions)

      expect(createBeneficiaryMultiLocation).toHaveBeenCalledWith(mockOptions)
      expect(addXcmVersionHeader).toHaveBeenCalledWith(mockMultiLocation, mockOptions.version)
      expect(result).toEqual(versionedMultiLocation)
    })

    it('should handle different versions correctly', () => {
      const version = Version.V3

      const mockOptions = {
        api: {} as IPolkadotApi<unknown, unknown>,
        paraId: 3000,
        version
      } as TCreateBeneficiaryOptions<unknown, unknown>

      const versionedResult = { some: 'data', version }

      vi.mocked(createBeneficiaryMultiLocation).mockReturnValue(mockMultiLocation)
      vi.mocked(addXcmVersionHeader).mockReturnValue(versionedResult)

      const result = createVersionedBeneficiary(mockOptions)

      expect(addXcmVersionHeader).toHaveBeenCalledWith(mockMultiLocation, version)
      expect(result).toEqual(versionedResult)
    })
  })
})
