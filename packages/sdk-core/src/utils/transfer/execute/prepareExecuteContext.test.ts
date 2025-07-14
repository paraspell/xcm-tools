import { isAssetEqual, type TMultiAsset } from '@paraspell/assets'
import { type TMultiLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { localizeLocation } from '../../location'
import { createMultiAsset } from '../../multiAsset'
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

vi.mock('../../multiAsset', () => ({
  createMultiAsset: vi.fn()
}))

vi.mock('./getAssetReserveChain', () => ({
  getAssetReserveChain: vi.fn()
}))

describe('prepareExecuteContext', () => {
  const mockMultiLocation: TMultiLocation = { parents: 1, interior: { Here: null } }
  const mockFeeMultiLocation: TMultiLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }

  const chain = 'Acala'
  const destChain = 'Moonbeam'

  const mockOptions = {
    chain,
    destChain,
    asset: {
      amount: '1000000000000',
      multiLocation: mockMultiLocation
    },
    fees: {
      originFee: 100000000n
    },
    version: Version.V3
  } as TCreateBaseTransferXcmOptions

  const mockMultiAsset = { id: {}, fun: { Fungible: 1000000000000n } } as TMultiAsset
  const mockLocalizedLocation = { parents: 0, interior: { Here: null } }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createMultiAsset).mockReturnValue(mockMultiAsset)
    vi.mocked(localizeLocation).mockReturnValue(mockLocalizedLocation)
    vi.mocked(getAssetReserveChain).mockReturnValue('AssetHubPolkadot')
  })

  it('creates execute context without fee asset', () => {
    const result = prepareExecuteContext(mockOptions)

    expect(assertHasLocation).toHaveBeenCalledWith(mockOptions.asset)
    expect(getAssetReserveChain).toHaveBeenCalledWith(chain, destChain, mockMultiLocation)
    expect(createMultiAsset).toHaveBeenCalledTimes(4)
    expect(localizeLocation).toHaveBeenCalledTimes(3)

    expect(result).toEqual({
      amount: 1000000000000n,
      multiAsset: mockMultiAsset,
      multiAssetLocalized: mockMultiAsset,
      multiAssetLocalizedToDest: mockMultiAsset,
      multiAssetLocalizedToReserve: mockMultiAsset,
      feeMultiAsset: undefined,
      feeMultiAssetLocalized: undefined,
      reserveChain: 'AssetHubPolkadot'
    })
  })

  it('creates execute context with different fee asset', () => {
    const optionsWithFee = {
      ...mockOptions,
      feeAsset: {
        multiLocation: mockFeeMultiLocation
      }
    } as TCreateBaseTransferXcmOptions

    vi.mocked(isAssetEqual).mockReturnValue(false)

    const result = prepareExecuteContext(optionsWithFee)

    expect(assertHasLocation).toHaveBeenCalledWith(mockOptions.asset)
    expect(assertHasLocation).toHaveBeenCalledWith(optionsWithFee.feeAsset)
    expect(createMultiAsset).toHaveBeenCalledTimes(6) // 4 base + 2 fee assets
    expect(localizeLocation).toHaveBeenCalledTimes(4) // 3 base + 1 fee asset

    expect(result.feeMultiAsset).toBe(mockMultiAsset)
    expect(result.feeMultiAssetLocalized).toBe(mockMultiAsset)
  })

  it('does not create fee assets when fee asset equals main asset', () => {
    const optionsWithFee = {
      ...mockOptions,
      feeAsset: {
        multiLocation: mockMultiLocation
      }
    } as TCreateBaseTransferXcmOptions

    vi.mocked(isAssetEqual).mockReturnValue(true)

    const result = prepareExecuteContext(optionsWithFee)

    expect(isAssetEqual).toHaveBeenCalledWith(mockOptions.asset, optionsWithFee.feeAsset)
    expect(createMultiAsset).toHaveBeenCalledTimes(4) // Only base assets
    expect(result.feeMultiAsset).toBeUndefined()
    expect(result.feeMultiAssetLocalized).toBeUndefined()
  })

  it('localizes to different chains correctly', () => {
    prepareExecuteContext(mockOptions)

    expect(localizeLocation).toHaveBeenCalledWith('Acala', mockMultiLocation)
    expect(localizeLocation).toHaveBeenCalledWith('Moonbeam', mockMultiLocation)
    expect(localizeLocation).toHaveBeenCalledWith('AssetHubPolkadot', mockMultiLocation)
  })

  it('converts string amount to bigint', () => {
    const result = prepareExecuteContext(mockOptions)

    expect(result.amount).toBe(1000000000000n)
    expect(typeof result.amount).toBe('bigint')
  })
})
