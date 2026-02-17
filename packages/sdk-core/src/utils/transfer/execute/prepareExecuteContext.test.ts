import { isAssetEqual, type TAsset } from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { createAsset } from '../../asset'
import { getAssetReserveChain } from '../../chain'
import { localizeLocation } from '../../location'
import { prepareExecuteContext } from './prepareExecuteContext'

vi.mock('@paraspell/assets')

vi.mock('../../location')
vi.mock('../../asset')
vi.mock('../../chain')

describe('prepareExecuteContext', () => {
  const mockLocation: TLocation = { parents: 1, interior: { Here: null } }
  const mockFeeLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }

  const chain = 'Acala'
  const destChain = 'Moonbeam'

  const mockOptions = {
    chain,
    destChain,
    assetInfo: {
      amount: 1000000000000n,
      location: mockLocation
    },
    fees: {
      originFee: 100000000n
    },
    version: Version.V3
  } as TCreateBaseTransferXcmOptions<unknown>

  const mockAsset = { id: {}, fun: { Fungible: 1000000000000n } } as TAsset
  const mockLocalizedLocation = { parents: 0, interior: { Here: null } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAsset).mockReturnValue(mockAsset)
    vi.mocked(localizeLocation).mockReturnValue(mockLocalizedLocation)
    vi.mocked(getAssetReserveChain).mockReturnValue('AssetHubPolkadot')
  })

  it('creates execute context without fee asset', () => {
    const result = prepareExecuteContext(mockOptions)

    expect(getAssetReserveChain).toHaveBeenCalledWith(chain, mockLocation)
    expect(createAsset).toHaveBeenCalledTimes(4)
    expect(localizeLocation).toHaveBeenCalledTimes(3)

    expect(result).toEqual({
      amount: 1000000000000n,
      asset: mockAsset,
      assetLocalized: mockAsset,
      assetLocalizedToDest: mockAsset,
      assetLocalizedToReserve: mockAsset,
      feeAsset: undefined,
      feeAssetLocalized: undefined,
      feeAssetLocalizedToDest: undefined,
      feeAssetLocalizedToReserve: undefined,
      reserveChain: 'AssetHubPolkadot'
    })
  })

  it('creates execute context with different fee asset', () => {
    const optionsWithFee = {
      ...mockOptions,
      feeAssetInfo: {
        location: mockFeeLocation
      }
    } as TCreateBaseTransferXcmOptions<unknown>

    vi.mocked(isAssetEqual).mockReturnValue(false)

    const result = prepareExecuteContext(optionsWithFee)

    expect(createAsset).toHaveBeenCalledTimes(8) // 4 base + 4 fee assets
    expect(localizeLocation).toHaveBeenCalledTimes(6) // 3 base + 3 fee assets

    expect(result.feeAsset).toBe(mockAsset)
    expect(result.feeAssetLocalized).toBe(mockAsset)
    expect(result.feeAssetLocalizedToDest).toBe(mockAsset)
    expect(result.feeAssetLocalizedToReserve).toBe(mockAsset)
  })

  it('does not create fee assets when fee asset equals main asset', () => {
    const optionsWithFee = {
      ...mockOptions,
      feeAssetInfo: {
        location: mockLocation
      }
    } as TCreateBaseTransferXcmOptions<unknown>

    vi.mocked(isAssetEqual).mockReturnValue(true)

    const result = prepareExecuteContext(optionsWithFee)

    expect(isAssetEqual).toHaveBeenCalledWith(mockOptions.assetInfo, optionsWithFee.feeAssetInfo)
    expect(createAsset).toHaveBeenCalledTimes(4) // Only base assets
    expect(result.feeAsset).toBeUndefined()
    expect(result.feeAssetLocalized).toBeUndefined()
    expect(result.feeAssetLocalizedToDest).toBeUndefined()
    expect(result.feeAssetLocalizedToReserve).toBeUndefined()
  })

  it('localizes to different chains correctly', () => {
    prepareExecuteContext(mockOptions)

    expect(localizeLocation).toHaveBeenCalledWith('Acala', mockLocation)
    expect(localizeLocation).toHaveBeenCalledWith('Moonbeam', mockLocation)
    expect(localizeLocation).toHaveBeenCalledWith('AssetHubPolkadot', mockLocation)
  })

  it('converts string amount to bigint', () => {
    const result = prepareExecuteContext(mockOptions)

    expect(result.amount).toBe(1000000000000n)
    expect(typeof result.amount).toBe('bigint')
  })
})
