import {
  findAssetInfoByLoc,
  getOtherAssets,
  hasXcmPaymentApiSupport,
  type TAssetWithLocation,
  type WithAmount
} from '@paraspell/assets'
import { Parents, type TLocation, type Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION, RELAY_LOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, padValueBy } from '../../utils'
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

  const defaultAssetInfo = {
    amount: 1000n,
    location: RELAY_LOCATION
  } as WithAmount<TAssetWithLocation>

  const mockOptions = {
    version: mockVersion
  } as TTypeAndThenCallContext<unknown, unknown>['options']

  const createContext = () =>
    ({
      origin: {
        chain: 'Polkadot',
        api: mockApi
      } as TChainWithApi<unknown, unknown>,
      reserve: {
        chain: 'Polkadot',
        api: mockApi
      } as TChainWithApi<unknown, unknown>,
      dest: {
        chain: 'Acala',
        api: mockApi
      } as TChainWithApi<unknown, unknown>,
      isSubBridge: false,
      assetInfo: { ...defaultAssetInfo },
      options: { ...mockOptions }
    }) as TTypeAndThenCallContext<unknown, unknown>

  let mockContext: TTypeAndThenCallContext<unknown, unknown>

  const mockXcm = [{ Mock: 'Instruction' }]

  const mockDepositReserveXcm = [
    {
      DepositReserveAsset: {
        assets: { Wild: 'All' },
        dest: {},
        xcm: mockXcm
      }
    }
  ] as unknown as ReturnType<typeof createCustomXcm>

  const mockSimpleXcm = [
    {
      DepositAsset: {}
    }
  ] as ReturnType<typeof createCustomXcm>

  const mockRefundInstruction = { SetAppendix: {} } as ReturnType<typeof createRefundInstruction>

  beforeEach(() => {
    vi.clearAllMocks()

    mockContext = createContext()

    vi.mocked(addXcmVersionHeader).mockReturnValue(mockXcmWithHeader)
    vi.mocked(padValueBy).mockReturnValue(mockPaddedFee)
    vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)
    vi.mocked(getOtherAssets).mockReturnValue([] as unknown as ReturnType<typeof getOtherAssets>)
    vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)
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

    const [depositReserveInstruction] = mockDepositReserveXcm

    if (!depositReserveInstruction || !('DepositReserveAsset' in depositReserveInstruction)) {
      throw new Error('DepositReserveAsset is not defined in mockDepositReserveXcm')
    }
    expect(addXcmVersionHeader).toHaveBeenNthCalledWith(
      2,
      depositReserveInstruction.DepositReserveAsset.xcm,
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

    expect(padValueBy).toHaveBeenCalledWith(mockFee, 20)
  })

  it('applies hydration padding when reserve chain is Hydration', async () => {
    const hydrationContext = {
      ...mockContext,
      reserve: {
        ...mockContext.reserve,
        chain: 'Hydration'
      }
    } as TTypeAndThenCallContext<unknown, unknown>

    await computeAllFees(hydrationContext, mockDepositReserveXcm, false, null)

    expect(padValueBy).toHaveBeenCalledWith(mockFee, 500)
  })

  it('applies ETH asset padding when destination is an Asset Hub chain', async () => {
    const ethLocation: TLocation = {
      parents: Parents.ONE,
      interior: { X1: [{ Parachain: 1 }] }
    }

    vi.mocked(getOtherAssets).mockReturnValue([
      {
        location: ethLocation
      }
    ] as unknown as ReturnType<typeof getOtherAssets>)
    vi.mocked(findAssetInfoByLoc).mockImplementation((assets, location) =>
      location === ethLocation ? (assets[0] as never) : undefined
    )

    const ethContext = {
      ...mockContext,
      dest: {
        ...mockContext.dest,
        chain: 'AssetHubPolkadot'
      },
      assetInfo: {
        ...mockContext.assetInfo,
        location: ethLocation
      }
    } as TTypeAndThenCallContext<unknown, unknown>

    await computeAllFees(ethContext, mockDepositReserveXcm, false, null)

    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetInfoByLoc).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ location: ethLocation })]),
      ethLocation
    )
    expect(padValueBy).toHaveBeenCalledWith(mockFee, 100)
  })
})
