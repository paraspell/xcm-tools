import type { TMultiAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import type { TCreateTransferXcmOptions } from '../../../types'
import { createBeneficiaryLocation } from '../../location'
import { sortMultiAssets } from '../../multiAsset'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'
import type { TExecuteContext } from './prepareExecuteContext'
import { prepareExecuteContext } from './prepareExecuteContext'

vi.mock('../../location', () => ({
  createBeneficiaryLocation: vi.fn()
}))

vi.mock('../../multiAsset', () => ({
  sortMultiAssets: vi.fn()
}))

vi.mock('./createAssetsFilter', () => ({
  createAssetsFilter: vi.fn()
}))

vi.mock('./prepareExecuteContext', () => ({
  prepareExecuteContext: vi.fn()
}))

describe('prepareCommonExecuteXcm', () => {
  const mockApi = { api: 'mock' } as unknown as IPolkadotApi<unknown, unknown>
  const mockMultiAsset = { id: {}, fun: { Fungible: 1000n } } as TMultiAsset
  const mockFeeMultiAsset = { id: {}, fun: { Fungible: 100n } } as TMultiAsset
  const mockBeneficiary = {
    parents: 0,
    interior: { X1: { AccountId32: { id: 'address' } } }
  } as TMultiLocation
  const mockAssetsFilter = { Wild: 'All' } as unknown as ReturnType<typeof createAssetsFilter>

  const baseOptions = {
    api: mockApi,
    recipientAddress: '5GrpknVvGGrGH3EFuURXeMrWHvbpj3VfER1oX5jFtuGbfzCE',
    version: 'V3',
    chain: 'Acala',
    destChain: 'Moonbeam',
    asset: {
      amount: '1000000000000',
      multiLocation: { parents: 1, interior: { Here: null } }
    },
    fees: {
      originFee: 100000000n
    }
  } as TCreateTransferXcmOptions<unknown, unknown>

  const mockContext = {
    multiAssetLocalized: mockMultiAsset,
    multiAssetLocalizedToDest: mockMultiAsset,
    feeMultiAssetLocalized: undefined
  } as TExecuteContext

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prepareExecuteContext).mockReturnValue(mockContext)
    vi.mocked(sortMultiAssets).mockReturnValue([mockMultiAsset])
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiary)
    vi.mocked(createAssetsFilter).mockReturnValue(mockAssetsFilter)
  })

  it('creates XCM without fee asset', () => {
    const result = prepareCommonExecuteXcm(baseOptions)

    expect(prepareExecuteContext).toHaveBeenCalledWith(baseOptions)
    expect(sortMultiAssets).toHaveBeenCalledWith([mockMultiAsset])
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: baseOptions.recipientAddress,
      version: 'V3'
    })
    expect(createAssetsFilter).toHaveBeenCalledWith(mockMultiAsset)

    expect(result.prefix).toEqual([
      { WithdrawAsset: [mockMultiAsset] },
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
      feeAsset: {
        multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } }
      }
    } as TCreateTransferXcmOptions<unknown, unknown>

    const contextWithFee = {
      ...mockContext,
      feeMultiAssetLocalized: mockFeeMultiAsset
    }

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)
    vi.mocked(sortMultiAssets).mockReturnValue([mockMultiAsset, mockFeeMultiAsset])

    const result = prepareCommonExecuteXcm(optionsWithFee)

    expect(sortMultiAssets).toHaveBeenCalledWith([mockMultiAsset, mockFeeMultiAsset])

    expect(result.prefix).toEqual([
      { WithdrawAsset: [mockMultiAsset, mockFeeMultiAsset] },
      {
        BuyExecution: {
          fees: mockFeeMultiAsset,
          weight_limit: {
            Limited: { ref_time: 450n, proof_size: 0n }
          }
        }
      }
    ])
  })

  it('uses fee asset for BuyExecution when available', () => {
    const contextWithFee = {
      ...mockContext,
      feeMultiAssetLocalized: mockFeeMultiAsset
    } as TExecuteContext

    vi.mocked(prepareExecuteContext).mockReturnValue(contextWithFee)

    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      feeAsset: { multiLocation: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown>)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyExecution = result.prefix[1] as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(buyExecution.BuyExecution.fees).toBe(mockFeeMultiAsset)
  })

  it('falls back to main asset for BuyExecution when no fee asset', () => {
    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      feeAsset: { multiLocation: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown>)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyExecution = result.prefix[1] as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(buyExecution.BuyExecution.fees).toBe(mockMultiAsset)
  })

  it('uses custom multiAssetToDeposit when provided', () => {
    const customAsset = { id: {}, fun: { Fungible: 500n } } as TMultiAsset

    prepareCommonExecuteXcm(baseOptions, customAsset)

    expect(createAssetsFilter).toHaveBeenCalledWith(customAsset)
  })

  it('uses multiAssetLocalizedToDest when no custom deposit asset', () => {
    prepareCommonExecuteXcm(baseOptions)

    expect(createAssetsFilter).toHaveBeenCalledWith(mockMultiAsset)
  })

  it('creates correct weight limit for BuyExecution', () => {
    const result = prepareCommonExecuteXcm({
      ...baseOptions,
      feeAsset: { multiLocation: { parents: 1, interior: { Here: null } } }
    } as TCreateTransferXcmOptions<unknown, unknown>)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyExecution = result.prefix[1] as any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(buyExecution.BuyExecution.weight_limit).toEqual({
      Limited: { ref_time: 450n, proof_size: 0n }
    })
  })
})
