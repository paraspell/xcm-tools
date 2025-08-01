import type { TMultiAsset } from '@paraspell/assets'
import type {
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../nodes/config'
import { createDestination, createVersionedDestination } from '../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions, TXcmVersioned } from '../../types'
import {
  addXcmVersionHeader,
  assertHasLocation,
  createBeneficiaryLocation,
  createMultiAsset
} from '../../utils'
import { createTypeAndThenCall } from './createTypeAndThenCall'

vi.mock('../../constants')
vi.mock('../../nodes/config')
vi.mock('../../pallets/xcmPallet/utils')
vi.mock('../../utils')

describe('createTypeAndThenCall', () => {
  const mockInput = {
    api: {},
    destination: 'destination-value' as TNodeWithRelayChains,
    asset: {
      amount: 1000000000000n,
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } }
    },
    version: 'V3',
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    paraIdTo: 2000
  } as TPolkadotXCMTransferOptions<unknown, unknown>
  const mockReserveFee = 500000000n

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getParaId).mockReturnValue(1001)
    vi.mocked(createDestination).mockReturnValue('mocked-destination' as unknown as TMultiLocation)
    vi.mocked(createVersionedDestination).mockReturnValue(
      'mocked-versioned-destination' as unknown as TXcmVersioned<TMultiLocation>
    )
    vi.mocked(createBeneficiaryLocation).mockReturnValue(
      'mocked-beneficiary' as unknown as TMultiLocation
    )
    vi.mocked(createMultiAsset).mockReturnValue({
      id: 'mocked-asset-id',
      fun: { Fungible: 1000000000000n }
    } as unknown as TMultiAsset)
    vi.mocked(addXcmVersionHeader).mockReturnValue('mocked-versioned-header')
  })

  it('should use LocalReserve when chain equals reserveChain', () => {
    const result = createTypeAndThenCall(
      'Kusama' as TNodeDotKsmWithRelayChains,
      'Acala' as TNodeWithRelayChains,
      'Kusama' as TNodeDotKsmWithRelayChains,
      mockInput,
      mockReserveFee
    )

    expect(result.parameters.assets_transfer_type).toBe('LocalReserve')
    expect(result.parameters.fees_transfer_type).toBe('LocalReserve')
    expect(createMultiAsset).toHaveBeenCalledTimes(1)
    expect(createDestination).not.toHaveBeenCalled()
  })

  it('should use DestinationReserve when destChain equals reserveChain', () => {
    const result = createTypeAndThenCall(
      'Polkadot' as TNodeDotKsmWithRelayChains,
      'Acala' as TNodeWithRelayChains,
      'Acala' as TNodeDotKsmWithRelayChains,
      mockInput,
      mockReserveFee
    )

    expect(result.parameters.assets_transfer_type).toBe('DestinationReserve')
    expect(result.parameters.fees_transfer_type).toBe('DestinationReserve')
    expect(createMultiAsset).toHaveBeenCalledTimes(1)
    expect(createDestination).not.toHaveBeenCalled()
  })

  it('should use DestinationReserve when neither equals reserveChain', () => {
    const result = createTypeAndThenCall(
      'Polkadot' as TNodeDotKsmWithRelayChains,
      'Moonbeam' as TNodeWithRelayChains,
      'Acala' as TNodeDotKsmWithRelayChains,
      mockInput,
      mockReserveFee
    )

    expect(result.parameters.assets_transfer_type).toBe('DestinationReserve')
    expect(result.parameters.fees_transfer_type).toBe('DestinationReserve')
    expect(createDestination).toHaveBeenCalled()
    expect(createMultiAsset).toHaveBeenCalledTimes(2)
  })

  it('should return correct structure', () => {
    const result = createTypeAndThenCall(
      'Kusama' as TNodeDotKsmWithRelayChains,
      'Karura' as TNodeWithRelayChains,
      'Kusama' as TNodeDotKsmWithRelayChains,
      mockInput,
      mockReserveFee
    )

    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: 'mocked-versioned-destination',
        assets: 'mocked-versioned-header',
        assets_transfer_type: 'LocalReserve',
        remote_fees_id: 'mocked-versioned-header',
        fees_transfer_type: 'LocalReserve',
        custom_xcm_on_dest: 'mocked-versioned-header',
        weight_limit: 'Unlimited'
      }
    })
  })

  it('should call all required functions', () => {
    createTypeAndThenCall(
      'Polkadot' as TNodeDotKsmWithRelayChains,
      'Moonbeam' as TNodeWithRelayChains,
      'Acala' as TNodeDotKsmWithRelayChains,
      mockInput,
      mockReserveFee
    )

    expect(assertHasLocation).toHaveBeenCalledWith(mockInput.asset)
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockInput.api,
      address: mockInput.address,
      version: mockInput.version
    })
    expect(getParaId).toHaveBeenCalled()
    expect(createVersionedDestination).toHaveBeenCalled()
    expect(addXcmVersionHeader).toHaveBeenCalledTimes(3)
  })
})
