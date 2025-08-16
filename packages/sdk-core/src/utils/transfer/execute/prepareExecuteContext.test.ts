import { isAssetEqual, type TAsset } from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { localizeLocation } from '../../location'
import { createAsset } from '../../asset'
import { getAssetReserveChain } from './getAssetReserveChain'
import { prepareExecuteContext } from './prepareExecuteContext'

vi.mock('@paraspell/assets', () => ({
  isAssetEqual: vi.fn()
}))

vi.mock('../../assertions', () => ({
  assertHasLocation: vi.fn()
}))

vi.mock('../../location', () => ({
  localizeLocation: vi.fn()
}))

vi.mock('../../asset', () => ({
  createAsset: vi.fn()
}))

vi.mock('./getAssetReserveChain', () => ({
  getAssetReserveChain: vi.fn()
}))

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
  } as TCreateBaseTransferXcmOptions

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

    expect(assertHasLocation).toHaveBeenCalledWith(mockOptions.assetInfo)
    expect(getAssetReserveChain).toHaveBeenCalledWith(chain, destChain, mockLocation)
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
      reserveChain: 'AssetHubPolkadot'
    })
  })

  it('creates execute context with different fee asset', () => {
    const optionsWithFee = {
      ...mockOptions,
      feeAssetInfo: {
        location: mockFeeLocation
      }
    } as TCreateBaseTransferXcmOptions

    vi.mocked(isAssetEqual).mockReturnValue(false)

    const result = prepareExecuteContext(optionsWithFee)

    expect(assertHasLocation).toHaveBeenCalledWith(mockOptions.assetInfo)
    expect(assertHasLocation).toHaveBeenCalledWith(optionsWithFee.feeAssetInfo)
    expect(createAsset).toHaveBeenCalledTimes(6) // 4 base + 2 fee assets
    expect(localizeLocation).toHaveBeenCalledTimes(4) // 3 base + 1 fee asset

    expect(result.feeAsset).toBe(mockAsset)
    expect(result.feeAssetLocalized).toBe(mockAsset)
  })

  it('does not create fee assets when fee asset equals main asset', () => {
    const optionsWithFee = {
      ...mockOptions,
      feeAssetInfo: {
        location: mockLocation
      }
    } as TCreateBaseTransferXcmOptions

    vi.mocked(isAssetEqual).mockReturnValue(true)

    const result = prepareExecuteContext(optionsWithFee)

    expect(isAssetEqual).toHaveBeenCalledWith(mockOptions.assetInfo, optionsWithFee.feeAssetInfo)
    expect(createAsset).toHaveBeenCalledTimes(4) // Only base assets
    expect(result.feeAsset).toBeUndefined()
    expect(result.feeAssetLocalized).toBeUndefined()
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
