/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TAsset } from '@paraspell/assets'
import { isTrustedChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnsupportedOperationError } from '../../../errors'
import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { createDestination, getChainLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import type { TExecuteContext } from './prepareExecuteContext'
import { prepareExecuteContext } from './prepareExecuteContext'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isTrustedChain: vi.fn()
}))

vi.mock('../../location')
vi.mock('./createAssetsFilter')
vi.mock('./prepareExecuteContext')

describe('createBaseExecuteXcm', () => {
  const mockAsset: TAsset = {
    id: { Concrete: { parents: 0, interior: 'Here' } },
    fun: { Fungible: 1000n }
  }

  const mockVersion = Version.V3

  const mockBaseOptions = {
    chain: 'AssetHubPolkadot',
    destChain: 'AssetHubKusama',
    fees: {
      originFee: 100n,
      reserveFee: 50n
    },
    version: mockVersion,
    paraIdTo: 1000
  } as TCreateBaseTransferXcmOptions<unknown>

  const mockPrepareExecuteContext = {
    amount: 10000n,
    assetLocalized: mockAsset,
    assetLocalizedToReserve: mockAsset,
    assetLocalizedToDest: mockAsset
  } as TExecuteContext

  const mockDestLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
  const mockAssetsFilter = { Wild: 'All' } as unknown as ReturnType<typeof createAssetsFilter>
  const mockChainLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prepareExecuteContext).mockReturnValue(mockPrepareExecuteContext)
    vi.mocked(createDestination).mockReturnValue(mockDestLocation)
    vi.mocked(createAssetsFilter).mockReturnValue(mockAssetsFilter)
    vi.mocked(getChainLocation).mockReturnValue(mockChainLocation)
  })

  describe('Teleport transfers (trusted chains)', () => {
    it('should create teleport instructions for system chains', () => {
      vi.mocked(isTrustedChain).mockReturnValue(true)

      const result = createBaseExecuteXcm(mockBaseOptions)

      expect(result).toEqual([
        {
          InitiateTeleport: {
            assets: mockAssetsFilter,
            dest: mockDestLocation,
            xcm: [
              {
                BuyExecution: {
                  fees: {
                    ...mockAsset,
                    fun: { Fungible: 9900n } // amount - originFee
                  },
                  weight_limit: 'Unlimited'
                }
              }
            ]
          }
        }
      ])

      expect(isTrustedChain).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(isTrustedChain).toHaveBeenCalledWith('AssetHubKusama')
    })

    it('should handle teleport with fee multi-asset', () => {
      vi.mocked(isTrustedChain).mockReturnValue(true)

      const mockFeeAssetToDest: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 100n }
      }

      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        feeAsset: {} as TAsset,
        feeAssetLocalizedToDest: mockFeeAssetToDest
      })

      const result = createBaseExecuteXcm({ ...mockBaseOptions, useFeeAssetOnHops: true })

      const teleportInstruction = result[0] as any
      const buyExecution = teleportInstruction.InitiateTeleport.xcm[0].BuyExecution
      expect(buyExecution.fees).toBe(mockFeeAssetToDest)
      expect(buyExecution.fees.fun.Fungible).toBe(100n)
    })

    it('should include suffix XCM instructions', () => {
      vi.mocked(isTrustedChain).mockReturnValue(true)
      const suffixXcm = [{ ClearOrigin: {} }, { RefundSurplus: {} }]

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        suffixXcm
      })

      const teleportInstruction = result[0] as any
      expect(teleportInstruction.InitiateTeleport.xcm).toHaveLength(3)
      expect(teleportInstruction.InitiateTeleport.xcm[1]).toEqual({ ClearOrigin: {} })
      expect(teleportInstruction.InitiateTeleport.xcm[2]).toEqual({ RefundSurplus: {} })
    })
  })

  describe('Reserve transfers', () => {
    it('should create reserve transfer when origin is not reserve chain', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Acala'
      })

      const result = createBaseExecuteXcm(mockBaseOptions)

      expect(result).toEqual([
        {
          InitiateReserveWithdraw: {
            assets: mockAssetsFilter,
            reserve: mockChainLocation,
            xcm: [
              {
                BuyExecution: {
                  fees: {
                    ...mockAsset,
                    fun: { Fungible: 9998n } // amount - 2n
                  },
                  weight_limit: 'Unlimited'
                }
              },
              {
                DepositReserveAsset: {
                  assets: mockAssetsFilter,
                  dest: mockDestLocation,
                  xcm: [
                    {
                      BuyExecution: {
                        fees: {
                          ...mockAsset,
                          fun: { Fungible: 9850n } // amount - originFee - reserveFee
                        },
                        weight_limit: 'Unlimited'
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ])

      expect(getChainLocation).toHaveBeenCalledWith('AssetHubPolkadot', 'Acala')
    })

    it('should handle reserve transfer when destination is reserve chain', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'AssetHubKusama'
      })
      const suffixXcm = [{ ClearOrigin: {} }]

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        suffixXcm
      })

      const reserveInstruction = result[0] as any
      expect(reserveInstruction.InitiateReserveWithdraw.xcm).toHaveLength(2)
      expect(reserveInstruction.InitiateReserveWithdraw.xcm[1]).toEqual({ ClearOrigin: {} })
    })

    it('should handle reserve transfer with fee multi-asset', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)

      const mockFeeAssetToReserve: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 100n }
      }
      const mockFeeAssetToDest: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 100n }
      }

      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Acala',
        feeAsset: {} as TAsset,
        feeAssetLocalizedToReserve: mockFeeAssetToReserve,
        feeAssetLocalizedToDest: mockFeeAssetToDest
      })

      const result = createBaseExecuteXcm({ ...mockBaseOptions, useFeeAssetOnHops: true })

      const reserveInstruction = result[0] as any
      // InitiateReserveWithdraw BuyExecution uses fee asset directly
      const reserveBuyExecution = reserveInstruction.InitiateReserveWithdraw.xcm[0].BuyExecution
      expect(reserveBuyExecution.fees).toBe(mockFeeAssetToReserve)
      expect(reserveBuyExecution.fees.fun.Fungible).toBe(100n)

      // DepositReserveAsset BuyExecution uses fee asset directly
      const depositAsset = reserveInstruction.InitiateReserveWithdraw.xcm[1].DepositReserveAsset
      const destBuyExecution = depositAsset.xcm[0].BuyExecution
      expect(destBuyExecution.fees).toBe(mockFeeAssetToDest)
      expect(destBuyExecution.fees.fun.Fungible).toBe(100n)
    })
  })

  describe('Direct deposit transfers', () => {
    it('should create direct deposit when on reserve chain', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'AssetHubPolkadot'
      })

      const result = createBaseExecuteXcm(mockBaseOptions)

      expect(result).toEqual([
        {
          DepositReserveAsset: {
            assets: mockAssetsFilter,
            dest: mockDestLocation,
            xcm: [
              {
                BuyExecution: {
                  fees: {
                    ...mockAsset,
                    fun: { Fungible: 9850n } // amount - originFee - reserveFee
                  },
                  weight_limit: 'Unlimited'
                }
              }
            ]
          }
        }
      ])
    })

    it('should create direct deposit when no reserve chain', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'AssetHubPolkadot'
      })

      expect(result).toEqual([
        {
          DepositReserveAsset: {
            assets: mockAssetsFilter,
            dest: mockDestLocation,
            xcm: [
              {
                BuyExecution: {
                  fees: {
                    ...mockAsset,
                    fun: { Fungible: 9850n }
                  },
                  weight_limit: 'Unlimited'
                }
              }
            ]
          }
        }
      ])
    })

    it('should handle direct deposit when destination is reserve with suffix', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'AssetHubKusama'
      })
      const suffixXcm = [{ RefundSurplus: {} }]

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'Acala',
        suffixXcm
      })

      expect(result).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should throw error for non-AssetHubPolkadot chain without reserve chain', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)

      expect(() =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          chain: 'Acala'
        })
      ).toThrow(UnsupportedOperationError)

      expect(() =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          chain: 'Acala'
        })
      ).toThrow(
        'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
      )
    })

    it('should not throw error for AssetHubPolkadot without reserve chain', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)

      expect(() =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          chain: 'AssetHubPolkadot'
        })
      ).not.toThrow()
    })
  })

  it('should handle empty suffix XCM', () => {
    vi.mocked(isTrustedChain).mockReturnValue(true)

    const result = createBaseExecuteXcm({
      ...mockBaseOptions,
      suffixXcm: []
    })

    const teleportInstruction = result[0] as any
    expect(teleportInstruction.InitiateTeleport.xcm).toHaveLength(1)
  })

  it('should correctly call createAssetsFilter with appropriate assets', () => {
    vi.mocked(isTrustedChain).mockReturnValue(true)
    createBaseExecuteXcm(mockBaseOptions)
    expect(createAssetsFilter).toHaveBeenCalledWith(mockAsset, mockVersion)
  })

  it('should correctly call createDestination with all parameters', () => {
    createBaseExecuteXcm(mockBaseOptions)

    expect(createDestination).toHaveBeenCalledWith(
      mockVersion,
      'AssetHubPolkadot',
      'AssetHubKusama',
      1000
    )
  })

  it('should create InitiateTransfer when version is V5 or higher and transactOptions provided', () => {
    vi.mocked(isTrustedChain).mockReturnValue(true)

    const result = createBaseExecuteXcm({
      ...mockBaseOptions,
      version: Version.V5
    })

    expect(result[0]).toEqual({
      InitiateTeleport: {
        assets: mockAssetsFilter,
        dest: mockDestLocation,
        xcm: [
          {
            BuyExecution: {
              fees: {
                fun: {
                  Fungible: 9900n
                },
                id: {
                  Concrete: {
                    interior: 'Here',
                    parents: 0
                  }
                }
              },
              weight_limit: 'Unlimited'
            }
          }
        ]
      }
    })
  })
})
