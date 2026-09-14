/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TAsset, TAssetInfo, WithAmount } from '@paraspell/assets'
import { isTrustedChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../../api'
import { ScenarioNotSupportedError, UnsupportedOperationError } from '../../../errors'
import type { TCreateTransferXcmOptions } from '../../../types'
import { createDestination, getChainLocation } from '../../location'
import { isNativeAssetTeleport } from '../isNativeAssetTeleport'
import { createAllCountedFilter, createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import type { TExecuteContext } from './prepareExecuteContext'
import { prepareExecuteContext } from './prepareExecuteContext'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isTrustedChain: vi.fn()
}))

vi.mock('../../location')
vi.mock('../isNativeAssetTeleport')
vi.mock('./createAssetsFilter')
vi.mock('./prepareExecuteContext')

describe('createBaseExecuteXcm', () => {
  const mockAsset: TAsset = {
    id: { Concrete: { parents: 0, interior: 'Here' } },
    fun: { Fungible: 1000n }
  }

  const mockVersion = Version.V3

  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>

  const mockBaseOptions = {
    api: mockApi,
    chain: 'AssetHubPolkadot',
    destChain: 'AssetHubKusama',
    fees: {
      originFee: 100n,
      reserveFee: 50n,
      destFee: 25n
    },
    version: mockVersion,
    paraIdTo: 1000
  } as TCreateTransferXcmOptions<unknown, unknown, unknown>

  const mockPrepareExecuteContext = {
    amount: 10000n,
    assetLocalized: mockAsset,
    assetLocalizedToReserve: mockAsset,
    assetLocalizedToDest: mockAsset
  } as TExecuteContext

  const mockDestLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
  const mockAssetsFilter = { Wild: 'All' } as unknown as ReturnType<typeof createAssetsFilter>
  const mockAllCountedFilter = { Wild: { AllCounted: 2 } }
  const mockChainLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }

  const dotInfo = {
    symbol: 'DOT',
    amount: 10000n,
    location: { parents: 1, interior: { Here: null } }
  } as WithAmount<TAssetInfo>
  const usdtInfo = {
    symbol: 'USDT',
    amount: 10000n,
    location: {
      parents: 1,
      interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
    }
  } as WithAmount<TAssetInfo>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prepareExecuteContext).mockReturnValue(mockPrepareExecuteContext)
    vi.mocked(createDestination).mockReturnValue(mockDestLocation)
    vi.mocked(createAssetsFilter).mockReturnValue(mockAssetsFilter)
    vi.mocked(createAllCountedFilter).mockReturnValue(mockAllCountedFilter)
    vi.mocked(getChainLocation).mockReturnValue(mockChainLocation)
    vi.mocked(isNativeAssetTeleport).mockReturnValue(false)
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

      const result = createBaseExecuteXcm(mockBaseOptions)

      const teleportInstruction = result[0] as any
      expect(teleportInstruction.InitiateTeleport.assets).toBe(mockAllCountedFilter)
      const buyExecution = teleportInstruction.InitiateTeleport.xcm[0].BuyExecution
      expect(buyExecution.fees).toBe(mockFeeAssetToDest)
      expect(buyExecution.fees.fun.Fungible).toBe(100n)
      expect(createAllCountedFilter).toHaveBeenCalledWith(2)
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

  describe('Native asset teleports (to/from AssetHub)', () => {
    it('should teleport a native parachain asset to AssetHub even when chains are not trusted', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(isNativeAssetTeleport).mockReturnValue(true)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Hydration'
      })

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'Hydration',
        destChain: 'AssetHubPolkadot'
      }) as any

      expect(result[0].InitiateTeleport).toBeDefined()
      expect(result[0].InitiateTeleport.dest).toBe(mockDestLocation)
      expect(result[0].InitiateTeleport.xcm[0].BuyExecution.fees).toEqual({
        ...mockAsset,
        fun: { Fungible: 9900n } // amount - originFee
      })
      expect(isNativeAssetTeleport).toHaveBeenCalledWith(
        mockApi,
        'Hydration',
        'AssetHubPolkadot',
        undefined
      )
    })

    it('should use Teleport filter in InitiateTransfer for native asset teleport on V5 transact', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(isNativeAssetTeleport).mockReturnValue(true)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Hydration'
      })

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'Hydration',
        destChain: 'AssetHubPolkadot',
        version: Version.V5,
        transactOptions: { call: 'dummy-call' }
      }) as any

      expect(result[0].InitiateTransfer).toBeDefined()
      expect(result[0].InitiateTransfer.remote_fees).toEqual({ Teleport: mockAssetsFilter })
      expect(result[0].InitiateTransfer.assets).toEqual([{ Teleport: mockAssetsFilter }])
    })

    it('should pay remote fees with the fee asset in InitiateTransfer on V5 transact', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(isNativeAssetTeleport).mockReturnValue(true)

      const mockFeeAssetLocalized: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 175n }
      }
      const mockFeeAssetsFilter = { Wild: 'Fee' } as unknown as ReturnType<
        typeof createAssetsFilter
      >

      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Hydration',
        feeAsset: {} as TAsset,
        feeAssetLocalized: mockFeeAssetLocalized
      })
      vi.mocked(createAssetsFilter).mockImplementation(asset =>
        asset === mockFeeAssetLocalized ? mockFeeAssetsFilter : mockAssetsFilter
      )

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'Hydration',
        destChain: 'AssetHubPolkadot',
        version: Version.V5,
        transactOptions: { call: 'dummy-call' }
      }) as any

      expect(createAssetsFilter).toHaveBeenCalledWith(mockFeeAssetLocalized, Version.V5)
      expect(result[0].InitiateTransfer.remote_fees).toEqual({ Teleport: mockFeeAssetsFilter })
      expect(result[0].InitiateTransfer.assets).toEqual([{ Teleport: mockAllCountedFilter }])
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

      expect(getChainLocation).toHaveBeenCalledWith('AssetHubPolkadot', 'Acala', undefined)
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

      const result = createBaseExecuteXcm(mockBaseOptions)

      const reserveInstruction = result[0] as any
      expect(reserveInstruction.InitiateReserveWithdraw.assets).toBe(mockAllCountedFilter)
      // InitiateReserveWithdraw BuyExecution uses fee asset directly
      const reserveBuyExecution = reserveInstruction.InitiateReserveWithdraw.xcm[0].BuyExecution
      expect(reserveBuyExecution.fees).toBe(mockFeeAssetToReserve)
      expect(reserveBuyExecution.fees.fun.Fungible).toBe(100n)

      // DepositReserveAsset forwards both assets and pays with the fee asset on destination
      const depositAsset = reserveInstruction.InitiateReserveWithdraw.xcm[1].DepositReserveAsset
      expect(depositAsset.assets).toBe(mockAllCountedFilter)
      const destBuyExecution = depositAsset.xcm[0].BuyExecution
      expect(destBuyExecution.fees).toBe(mockFeeAssetToDest)
      expect(destBuyExecution.fees.fun.Fungible).toBe(100n)
    })

    it('should pay with the destination fee asset amount when reserve is the destination', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)

      const mockFeeAssetToReserve: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 50n }
      }
      const mockFeeAssetToDest: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 25n }
      }

      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'AssetHubKusama',
        feeAsset: {} as TAsset,
        feeAssetLocalizedToReserve: mockFeeAssetToReserve,
        feeAssetLocalizedToDest: mockFeeAssetToDest
      })

      const result = createBaseExecuteXcm(mockBaseOptions) as any

      const reserveBuyExecution = result[0].InitiateReserveWithdraw.xcm[0].BuyExecution
      expect(reserveBuyExecution.fees).toBe(mockFeeAssetToDest)
      expect(result[0].InitiateReserveWithdraw.xcm).toHaveLength(1)
    })

    it('should throw when the fee asset has a different reserve chain than the transferred asset', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Acala',
        feeAsset: {} as TAsset,
        feeReserveChain: 'AssetHubPolkadot'
      })

      expect(() => createBaseExecuteXcm(mockBaseOptions)).toThrow(ScenarioNotSupportedError)
      expect(() => createBaseExecuteXcm(mockBaseOptions)).toThrow(
        'its reserve chain (AssetHubPolkadot) differs from the reserve chain of the transferred asset (Acala)'
      )
    })

    it('should not throw when the fee asset shares the reserve chain of the transferred asset', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Acala',
        feeAsset: {} as TAsset,
        feeReserveChain: 'Acala',
        feeAssetLocalizedToReserve: mockAsset,
        feeAssetLocalizedToDest: mockAsset
      })

      expect(() => createBaseExecuteXcm(mockBaseOptions)).not.toThrow()
    })

    it('should teleport to reserve when origin and reserve are both trusted and differ', () => {
      vi.mocked(isTrustedChain).mockReturnValue(true)
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Polkadot'
      })

      const result = createBaseExecuteXcm(mockBaseOptions) as any

      const teleport = result[0].InitiateTeleport
      expect(teleport.dest).toBe(mockChainLocation)
      expect(teleport.xcm[0].BuyExecution.fees).toEqual({
        ...mockAsset,
        fun: { Fungible: 9900n } // amount - originFeeDeduction
      })
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

    it('should forward both assets and pay with the fee asset on destination', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)

      const mockFeeAssetToDest: TAsset = {
        id: { Concrete: { parents: 1, interior: 'Here' } },
        fun: { Fungible: 25n }
      }

      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'AssetHubPolkadot',
        feeAsset: {} as TAsset,
        feeAssetLocalizedToDest: mockFeeAssetToDest
      })

      const result = createBaseExecuteXcm(mockBaseOptions) as any

      expect(result[0].DepositReserveAsset.assets).toBe(mockAllCountedFilter)
      expect(result[0].DepositReserveAsset.xcm[0].BuyExecution.fees).toBe(mockFeeAssetToDest)
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
      mockApi,
      mockVersion,
      'AssetHubPolkadot',
      'AssetHubKusama',
      1000
    )
  })

  it('should use BuyExecution (not PayFees) for the teleport hop on V5', () => {
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

  describe('Reserve to destination teleport leg', () => {
    const feeContext = {
      ...mockPrepareExecuteContext,
      reserveChain: 'AssetHubPolkadot',
      feeAsset: {} as TAsset,
      feeAssetLocalizedToReserve: mockAsset,
      feeAssetLocalizedToDest: mockAsset
    } as TExecuteContext

    beforeEach(() => {
      vi.mocked(isTrustedChain).mockImplementation(chain => chain !== 'Hydration')
    })

    it('should teleport from the reserve to a trusted destination instead of depositing reserve assets', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'AssetHubPolkadot'
      })

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'Hydration',
        destChain: 'Polkadot'
      }) as any

      expect(result[0].InitiateReserveWithdraw.xcm[1]).toEqual({
        InitiateTeleport: {
          assets: mockAssetsFilter,
          dest: mockDestLocation,
          xcm: [
            {
              BuyExecution: {
                fees: { ...mockAsset, fun: { Fungible: 9850n } },
                weight_limit: 'Unlimited'
              }
            }
          ]
        }
      })
      expect(createDestination).toHaveBeenCalledWith(
        mockApi,
        mockVersion,
        'AssetHubPolkadot',
        'Polkadot',
        1000
      )
    })

    it('should keep DepositReserveAsset when the destination is not a teleport target', () => {
      vi.mocked(isTrustedChain).mockReturnValue(false)
      vi.mocked(prepareExecuteContext).mockReturnValue(feeContext)

      const result = createBaseExecuteXcm({
        ...mockBaseOptions,
        chain: 'Hydration',
        destChain: 'Astar',
        assetInfo: dotInfo,
        feeAssetInfo: usdtInfo
      }) as any

      expect(result[0].InitiateReserveWithdraw.xcm[1].DepositReserveAsset).toBeDefined()
    })

    it('should throw when the fee asset cannot be teleported on the reserve leg', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue(feeContext)

      const build = () =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          chain: 'Hydration',
          destChain: 'Polkadot',
          assetInfo: dotInfo,
          feeAssetInfo: usdtInfo
        })

      expect(build).toThrow(ScenarioNotSupportedError)
      expect(build).toThrow(
        'Fee asset USDT cannot be teleported from AssetHubPolkadot to Polkadot, so it cannot pay fees there.'
      )
    })

    it('should allow the relay native asset to pay on the teleported reserve leg', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue(feeContext)

      expect(() =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          chain: 'Hydration',
          destChain: 'Polkadot',
          assetInfo: usdtInfo,
          feeAssetInfo: dotInfo
        })
      ).not.toThrow()
    })

    it('should allow a fee asset that teleports natively', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue(feeContext)
      vi.mocked(isNativeAssetTeleport).mockImplementation(
        (_api, _from, _to, asset) => asset === usdtInfo
      )

      expect(() =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          chain: 'Hydration',
          destChain: 'Polkadot',
          assetInfo: dotInfo,
          feeAssetInfo: usdtInfo
        })
      ).not.toThrow()
    })
  })

  describe('Fee asset teleportability on origin teleport legs', () => {
    beforeEach(() => {
      vi.mocked(isTrustedChain).mockReturnValue(true)
    })

    it('should throw for InitiateTeleport when the fee asset is not teleportable', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        feeAsset: {} as TAsset,
        feeAssetLocalizedToDest: mockAsset
      })

      expect(() =>
        createBaseExecuteXcm({ ...mockBaseOptions, assetInfo: dotInfo, feeAssetInfo: usdtInfo })
      ).toThrow('Fee asset USDT cannot be teleported from AssetHubPolkadot to AssetHubKusama')
    })

    it('should throw for InitiateTeleportToReserve when the fee asset is not teleportable', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        reserveChain: 'Polkadot',
        feeAsset: {} as TAsset,
        feeAssetLocalizedToReserve: mockAsset,
        feeAssetLocalizedToDest: mockAsset
      })

      expect(() =>
        createBaseExecuteXcm({ ...mockBaseOptions, assetInfo: dotInfo, feeAssetInfo: usdtInfo })
      ).toThrow('Fee asset USDT cannot be teleported from AssetHubPolkadot to Polkadot')
    })

    it('should throw for InitiateTransfer with a Teleport filter when the fee asset is not teleportable', () => {
      vi.mocked(prepareExecuteContext).mockReturnValue({
        ...mockPrepareExecuteContext,
        feeAsset: {} as TAsset,
        feeAssetLocalized: mockAsset
      })

      expect(() =>
        createBaseExecuteXcm({
          ...mockBaseOptions,
          version: Version.V5,
          transactOptions: { call: 'dummy-call' },
          assetInfo: dotInfo,
          feeAssetInfo: usdtInfo
        })
      ).toThrow(ScenarioNotSupportedError)
    })

    it('should not check teleportability when the fee asset equals the transferred asset', () => {
      expect(() =>
        createBaseExecuteXcm({ ...mockBaseOptions, assetInfo: usdtInfo, feeAssetInfo: usdtInfo })
      ).not.toThrow()
    })
  })
})
