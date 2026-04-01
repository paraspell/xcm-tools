import type { TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { createBeneficiaryLocation } from '../../utils'
import { createRefundInstruction } from './utils'

vi.mock('../../utils', () => ({
  createBeneficiaryLocation: vi.fn()
}))

describe('createRefundInstruction', () => {
  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>
  const mockSender = '0x123'
  const mockVersion = 'V3' as Version
  const mockBeneficiaryLocation = {} as TLocation

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiaryLocation)
  })

  it('should create refund instruction with correct structure', () => {
    const assetCount = 1

    const result = createRefundInstruction(mockApi, mockSender, mockVersion, assetCount)

    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockSender,
      version: mockVersion
    })

    expect(result).toEqual({
      SetAppendix: [
        {
          DepositAsset: {
            assets: { Wild: { AllCounted: assetCount } },
            beneficiary: mockBeneficiaryLocation
          }
        }
      ]
    })
  })
})
