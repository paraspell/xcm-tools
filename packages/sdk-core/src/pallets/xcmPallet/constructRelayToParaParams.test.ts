import type { TAsset } from '@paraspell/assets'
import { Parents, type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TRelayToParaOptions, TXcmVersioned } from '../../types'
import { addXcmVersionHeader, createBeneficiaryLocation, resolveParaId } from '../../utils'
import { createVersionedAssets } from '../../utils/asset'
import { constructRelayToParaParams } from './constructRelayToParaParams'
import { createVersionedDestination } from './utils'

vi.mock('../../utils')
vi.mock('./utils')
vi.mock('../../utils/asset')

describe('constructRelayToParaParams', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAmount = 1000n
  const mockAddress = 'address123'
  const mockParaId = 100
  const mockBeneficiary: TLocation = {
    parents: 0,
    interior: { X1: { AccountId32: { id: '0x1234' } } }
  }
  const mockDest: TLocation = {
    parents: 1,
    interior: { X1: { Parachain: 2000 } }
  }

  const options = {
    api: mockApi,
    origin: 'Polkadot',
    destination: 'Acala',
    address: mockAddress,
    paraIdTo: mockParaId,
    assetInfo: { amount: mockAmount }
  } as TRelayToParaOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiary)
    vi.mocked(addXcmVersionHeader).mockImplementation((obj, version) => ({
      [version]: obj
    }))
    vi.mocked(resolveParaId).mockReturnValue(mockParaId)
    vi.mocked(createVersionedAssets).mockReturnValue({} as TXcmVersioned<TAsset[]>)
    vi.mocked(createVersionedDestination).mockImplementation(version => ({
      [version as Version.V5]: mockDest
    }))
  })

  it('should construct parameters with location destination', () => {
    const version = Version.V4
    const result = constructRelayToParaParams(options, version)

    expect(createVersionedDestination).toHaveBeenCalledWith(
      version,
      options.origin,
      options.destination,
      mockParaId
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockAddress,
      version
    })
    expect(createVersionedAssets).toHaveBeenCalledWith(version, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: { [version]: mockDest },
      beneficiary: { [version]: mockBeneficiary },
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })

  it('should construct parameters without fee for location destination', () => {
    const version = Version.V4
    const result = constructRelayToParaParams(options, version)

    expect(createVersionedDestination).toHaveBeenCalledWith(
      version,
      options.origin,
      options.destination,
      mockParaId
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockAddress,
      version
    })
    expect(createVersionedAssets).toHaveBeenCalledWith(version, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: { [version]: mockDest },
      beneficiary: { [version]: mockBeneficiary },
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })

  it('should construct parameters without specifying paraIdTo', () => {
    const paraIdTo = undefined
    const version = Version.V4

    const result = constructRelayToParaParams(
      {
        ...options,
        paraIdTo
      },
      version
    )

    expect(resolveParaId).toHaveBeenCalledWith(paraIdTo, options.destination)
    expect(createVersionedDestination).toHaveBeenCalledWith(
      version,
      options.origin,
      options.destination,
      mockParaId
    )
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockApi,
      address: mockAddress,
      version
    })
    expect(createVersionedAssets).toHaveBeenCalledWith(version, mockAmount, {
      parents: Parents.ZERO,
      interior: 'Here'
    })
    expect(result).toEqual({
      dest: { [version]: mockDest },
      beneficiary: { [version]: mockBeneficiary },
      assets: {},
      fee_asset_item: DEFAULT_FEE_ASSET,
      weight_limit: 'Unlimited'
    })
  })
})
