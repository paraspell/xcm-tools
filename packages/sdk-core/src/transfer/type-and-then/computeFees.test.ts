import { hasXcmPaymentApiSupport } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, padFeeBy } from '../../utils'
import { computeAllFees } from './computeFees'
import type { createCustomXcm } from './createCustomXcm'
import type { createRefundInstruction } from './utils'

vi.mock('@paraspell/assets')
vi.mock('../../utils')
vi.mock('../fees')

describe('computeAllFees', () => {
  const mockVersion = 'V3' as Version
  const mockXcmWithHeader = { header: 'xcm' }
  const mockFee = 1000n
  const mockPaddedFee = 1200n

  const mockApi = {
    getXcmPaymentApiFee: vi.fn().mockResolvedValue(mockFee)
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockContext = {
    reserve: {
      chain: 'Polkadot',
      api: mockApi
    } as TChainWithApi<unknown, unknown>,
    dest: {
      chain: 'Acala',
      api: mockApi
    } as TChainWithApi<unknown, unknown>,
    options: {
      version: mockVersion
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  const mockDepositReserveXcm = {
    DepositReserveAsset: {}
  } as ReturnType<typeof createCustomXcm>

  const mockSimpleXcm = {
    DepositAsset: {}
  } as ReturnType<typeof createCustomXcm>

  const mockRefundInstruction = { SetAppendix: {} } as ReturnType<typeof createRefundInstruction>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(addXcmVersionHeader).mockReturnValue(mockXcmWithHeader)
    vi.mocked(padFeeBy).mockReturnValue(mockPaddedFee)
    vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)
  })

  it('should compute fees for DepositReserveAsset with refund', async () => {
    const spy = vi.spyOn(mockApi, 'getXcmPaymentApiFee')

    const result = await computeAllFees(
      mockContext,
      mockDepositReserveXcm,
      false,
      mockRefundInstruction
    )

    expect(spy).toHaveBeenCalledTimes(3)

    expect(spy).toHaveBeenCalledWith(
      'Polkadot',
      mockXcmWithHeader,
      [],
      { location: DOT_LOCATION },
      true
    )

    expect(result).toEqual({
      reserveFee: mockPaddedFee,
      refundFee: mockPaddedFee,
      destFee: mockPaddedFee
    })
  })

  it('should compute fees for DepositReserveAsset without refund', async () => {
    const spy = vi.spyOn(mockApi, 'getXcmPaymentApiFee')

    const result = await computeAllFees(mockContext, mockDepositReserveXcm, false, null)

    expect(spy).toHaveBeenCalledTimes(2)

    expect(result).toEqual({
      reserveFee: mockPaddedFee,
      refundFee: 0n,
      destFee: mockPaddedFee
    })
  })

  it('should use reserve for destFee when dest has no XCM payment API support', async () => {
    vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(false)

    const spy = vi.spyOn(mockApi, 'getXcmPaymentApiFee')

    await computeAllFees(mockContext, mockDepositReserveXcm, false, null)

    expect(hasXcmPaymentApiSupport).toHaveBeenCalledWith('Acala')

    expect(mockDepositReserveXcm).toHaveProperty('DepositReserveAsset')

    if (!('DepositReserveAsset' in mockDepositReserveXcm)) {
      throw new Error('DepositReserveAsset is not defined in mockDepositReserveXcm')
    }
    expect(addXcmVersionHeader).toHaveBeenNthCalledWith(
      2,
      mockDepositReserveXcm.DepositReserveAsset.xcm,
      mockVersion
    )

    expect(spy).toHaveBeenNthCalledWith(
      2,
      'Polkadot',
      mockXcmWithHeader,
      [],
      { location: DOT_LOCATION },
      true
    )
  })

  it('should compute fees for non-DOT asset without DepositReserveAsset', async () => {
    const spy = vi.spyOn(mockApi, 'getXcmPaymentApiFee')

    const result = await computeAllFees(mockContext, mockSimpleXcm, false, mockRefundInstruction)

    expect(spy).toHaveBeenCalledTimes(2)

    expect(spy).toHaveBeenCalledWith(
      'Acala',
      mockXcmWithHeader,
      [],
      { location: DOT_LOCATION },
      true
    )

    expect(result).toEqual({
      reserveFee: 0n,
      destFee: mockPaddedFee,
      refundFee: mockPaddedFee
    })
  })

  it('should return zero fees for DOT asset without DepositReserveAsset', async () => {
    const spy = vi.spyOn(mockApi, 'getXcmPaymentApiFee')

    const result = await computeAllFees(mockContext, mockSimpleXcm, true, mockRefundInstruction)

    expect(spy).not.toHaveBeenCalled()

    expect(result).toEqual({
      reserveFee: 0n,
      destFee: 0n,
      refundFee: 0n
    })
  })

  it('should apply correct padding percentage', async () => {
    await computeAllFees(mockContext, mockDepositReserveXcm, false, null)

    expect(padFeeBy).toHaveBeenCalledWith(mockFee, 20)
  })
})
