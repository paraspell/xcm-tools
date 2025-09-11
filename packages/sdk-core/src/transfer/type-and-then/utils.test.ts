import type { TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { createBeneficiaryLocation } from '../../utils'
import { createRefundInstruction } from './utils'

vi.mock('../../utils', () => ({
  createBeneficiaryLocation: vi.fn()
}))

describe('createRefundInstruction', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockSenderAddress = '0x123'
  const mockVersion = 'V3' as Version
  const mockBeneficiaryLocation = {} as TLocation

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiaryLocation)
  })

  it('should create refund instruction with correct structure', () => {
    const result = createRefundInstruction(mockApi, mockSenderAddress, mockVersion)

    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockSenderAddress,
      version: mockVersion
    })

    expect(result).toEqual({
      SetAppendix: [
        {
          DepositAsset: {
            assets: { Wild: 'All' },
            beneficiary: mockBeneficiaryLocation
          }
        }
      ]
    })
  })
})
