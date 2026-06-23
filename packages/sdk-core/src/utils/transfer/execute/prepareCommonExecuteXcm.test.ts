import type { TAsset } from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../../api'
import type { TCreateTransferXcmOptions } from '../../../types'
import { sortAssets } from '../../asset'
import { createBeneficiaryLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'
import type { TExecuteContext } from './prepareExecuteContext'
import { prepareExecuteContext } from './prepareExecuteContext'

vi.mock('../../location')
vi.mock('../../asset')
vi.mock('./createAssetsFilter')
vi.mock('./prepareExecuteContext')

describe('prepareCommonExecuteXcm', () => {
  const mockApi = { api: 'mock' } as unknown as PolkadotApi<unknown, unknown, unknown>
  const mockAsset = { id: {}, fun: { Fungible: 1000n } } as TAsset
  const mockFeeAsset = { id: {}, fun: { Fungible: 100n } } as TAsset
  const mockVersion = Version.V3
  const mockBeneficiary = {
    parents: 0,
    interior: { X1: { AccountId32: { id: 'address' } } }
  } as TLocation
  const mockAssetsFilter = { Wild: 'All' } as unknown as ReturnType<typeof createAssetsFilter>

  const baseOptions = {
    api: mockApi,
    recipient: '5GrpknVvGGrGH3EFuURXeMrWHvbpj3VfER1oX5jFtuGbfzCE',
    version: mockVersion,
    chain: 'Acala',
    destChain: 'Moonbeam',
    assetInfo: {
      amount: 1000000000000n,
      location: { parents: 1, interior: { Here: null } }
    },
    fees: {
      originFee: 100000000n
    }
  } as TCreateTransferXcmOptions<unknown, unknown, unknown>

  const mockContext = {
    assetLocalized: mockAsset,
    assetLocalizedToDest: mockAsset,
    feeAssetLocalized: undefined
  } as TExecuteContext

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prepareExecuteContext).mockReturnValue(mockContext)
    vi.mocked(sortAssets).mockReturnValue([mockAsset])
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiary)
    vi.mocked(createAssetsFilter).mockReturnValue(mockAssetsFilter)
  })

  it('creates XCM without fee asset', () => {
    const result = prepareCommonExecuteXcm(baseOptions)

    expect(prepareExecuteContext).toHaveBeenCalledWith(baseOptions)
    expect(sortAssets).toHaveBeenCalledWith([mockAsset])
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: baseOptions.recipient,
      version: mockVersion
    })
    expect(createAssetsFilter).toHaveBeenCalledWith(mockAsset, mockVersion)

    expect(result.prefix).toEqual([
      { WithdrawAsset: [mockAsset] },
      { SetFeesMode: { jit_withdraw: true } }
    ])

    expect(result.depositInstruction).toEqual({
      DepositAsset: {
        assets: mockAssetsFilter,
        beneficiary: mockBeneficiary
      }
    })
  })

  it('creates XCM with fee asset', () => {
    const optionsWithFee = {
      ...baseOptions,
      feeAssetInfo: {
        location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
      }
    } as TCreateTransferXcmOptions<unknown, unknown, unknown>

    const contextWithFee = {
      ...mockContext,
      feeAssetLocalized: mockFeeAsset
    }

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)
    vi.mocked(sortAssets).mockReturnValue([mockAsset, mockFeeAsset])

    const result = prepareCommonExecuteXcm(optionsWithFee)

    expect(sortAssets).toHaveBeenCalledWith([mockAsset, mockFeeAsset])

    expect(result.prefix).toEqual([
      { WithdrawAsset: [mockAsset, mockFeeAsset] },
      {
        BuyExecution: {
          fees: mockFeeAsset,
          weight_limit: 'Unlimited'
        }
      }
    ])
  })

  it('uses fee asset for BuyExecution when available', () => {
    const contextWithFee = {
      ...mockContext,
      feeAssetLocalized: mockFeeAsset
    } as TExecuteContext

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)

    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      feeAssetInfo: { location: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown, unknown>)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyExecution = result.prefix[1] as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(buyExecution.BuyExecution.fees).toBe(mockFeeAsset)
  })

  it('uses jit_withdraw when there is no separate localized fee asset (e.g. fee asset equals main asset)', () => {
    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      feeAssetInfo: { location: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown, unknown>)

    expect(result.prefix[1]).toEqual({ SetFeesMode: { jit_withdraw: true } })
  })

  it('uses jit_withdraw when useJitWithdraw is true even with fee asset', () => {
    const optionsWithFee = {
      ...baseOptions,
      feeAssetInfo: {
        location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
      },
      useJitWithdraw: true
    } as TCreateTransferXcmOptions<unknown, unknown, unknown>

    const contextWithFee = {
      ...mockContext,
      feeAssetLocalized: mockFeeAsset
    }

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)
    vi.mocked(sortAssets).mockReturnValue([mockAsset, mockFeeAsset])

    const result = prepareCommonExecuteXcm(optionsWithFee)

    // DOT should still be in WithdrawAsset
    expect(sortAssets).toHaveBeenCalledWith([mockAsset, mockFeeAsset])

    // But should use jit_withdraw instead of BuyExecution
    expect(result.prefix).toEqual([
      { WithdrawAsset: [mockAsset, mockFeeAsset] },
      { SetFeesMode: { jit_withdraw: true } }
    ])
  })

  it('uses custom assetToDeposit when provided', () => {
    const customAsset = { id: {}, fun: { Fungible: 500n } } as TAsset
    prepareCommonExecuteXcm(baseOptions, customAsset)
    expect(createAssetsFilter).toHaveBeenCalledWith(customAsset, mockVersion)
  })

  it('uses assetLocalizedToDest when no custom deposit asset', () => {
    prepareCommonExecuteXcm(baseOptions)
    expect(createAssetsFilter).toHaveBeenCalledWith(mockAsset, mockVersion)
  })

  it('uses Unlimited weight for pre-V5 BuyExecution (separate fee asset)', () => {
    const contextWithFee = {
      ...mockContext,
      feeAssetLocalized: mockFeeAsset
    } as TExecuteContext

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)

    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      feeAssetInfo: { location: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown, unknown>)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyExecution = result.prefix[1] as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(buyExecution.BuyExecution.weight_limit).toEqual('Unlimited')
  })

  it('emits PayFees without RefundSurplus on V5 for a separate fee asset (kept in fees register for delivery fees)', () => {
    const contextWithFee = {
      ...mockContext,
      feeAssetLocalized: mockFeeAsset
    } as TExecuteContext

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)

    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      version: Version.V5,
      feeAssetInfo: { location: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown, unknown>)

    expect(result.prefix[1]).toEqual({ PayFees: { asset: mockFeeAsset } })
    // No RefundSurplus in the prefix (issue #1719) — next instruction is the deposit, not a refund
    expect(result.prefix[2]).toBeUndefined()
  })
})
