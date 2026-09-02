import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { normalizeLocation } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { MIN_AMOUNT, RELAY_LOCATION } from '../../constants'
import { addXcmVersionHeader, createAsset, getRelayChainOf, sortAssets } from '../../utils'
import { createBeneficiaryLocation } from '../../utils/location'
import { getBridgeDestFee } from './getBridgeDestFee'

vi.mock('@paraspell/assets')
vi.mock('../../utils')
vi.mock('../../utils/location')

describe('getBridgeDestFee', () => {
  const version = Version.V5
  const recipient = 'dest-address'

  const mockApi = {
    localizeLocation: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const mockDestApi = {
    getXcmPaymentApiFee: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const snowbridgeAsset = {
    symbol: 'CGT2.0',
    decimals: 18,
    amount: 1000n,
    location: { parents: 2, interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }] } }
  } as WithAmount<TAssetInfo>

  const foreignRelayAsset = {
    symbol: 'DOT',
    decimals: 10,
    amount: 1000n,
    location: { parents: 2, interior: { X1: [{ GlobalConsensus: { polkadot: null } }] } }
  } as WithAmount<TAssetInfo>

  const nativeRelayAsset = {
    symbol: 'KSM',
    decimals: 12,
    amount: 1000n,
    location: RELAY_LOCATION
  } as WithAmount<TAssetInfo>

  const feeAssetInfo: TAssetInfo = {
    symbol: 'KSM',
    decimals: 12,
    location: { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } }
  }

  const mockAsset = { id: RELAY_LOCATION, fun: { Fungible: 1n } }
  const mockBeneficiary = { parents: 0, interior: { Here: null } }

  const instructionsOf = (call: unknown) =>
    (Object.values(call as Record<string, unknown[]>)[0] as Record<string, unknown>[]).map(
      i => Object.keys(i)[0]
    )

  const callFor = (assetInfo: WithAmount<TAssetInfo>, hasSystemFeeAsset: boolean) =>
    getBridgeDestFee(
      mockApi,
      mockDestApi,
      'AssetHubKusama',
      'AssetHubPolkadot',
      assetInfo,
      feeAssetInfo,
      hasSystemFeeAsset,
      recipient,
      version
    )

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(mockApi, 'localizeLocation').mockImplementation((_chain, location) => location)
    vi.mocked(createAsset).mockReturnValue(mockAsset)
    vi.mocked(sortAssets).mockImplementation(assets => assets)
    vi.mocked(normalizeLocation).mockImplementation(location => location)
    vi.mocked(addXcmVersionHeader).mockImplementation((xcm, v) => ({ [v]: xcm }))
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiary)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.spyOn(mockDestApi, 'getXcmPaymentApiFee').mockResolvedValue(12345n)
  })

  it('splits the fee asset from the transferred asset when the destination is the reserve', async () => {
    const spy = vi.spyOn(mockDestApi, 'getXcmPaymentApiFee')

    const fee = await callFor(snowbridgeAsset, true)

    expect(fee).toBe(12345n)
    expect(instructionsOf(spy.mock.calls[0][1])).toEqual([
      'ReserveAssetDeposited',
      'BuyExecution',
      'WithdrawAsset',
      'ClearOrigin',
      'BuyExecution',
      'DepositAsset',
      'SetTopic'
    ])
    expect(spy).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      expect.anything(),
      [],
      feeAssetInfo,
      version,
      true
    )
  })

  it('withdraws when the destination is the reserve and no system fee asset is attached', async () => {
    const spy = vi.spyOn(mockDestApi, 'getXcmPaymentApiFee')

    await callFor(foreignRelayAsset, false)

    expect(instructionsOf(spy.mock.calls[0][1])).toEqual([
      'WithdrawAsset',
      'ClearOrigin',
      'BuyExecution',
      'BuyExecution',
      'DepositAsset',
      'SetTopic'
    ])
  })

  it('deposits into reserve when the origin is the reserve', async () => {
    const spy = vi.spyOn(mockDestApi, 'getXcmPaymentApiFee')

    await callFor(nativeRelayAsset, false)

    expect(instructionsOf(spy.mock.calls[0][1])).toEqual([
      'ReserveAssetDeposited',
      'ClearOrigin',
      'BuyExecution',
      'BuyExecution',
      'DepositAsset',
      'SetTopic'
    ])
  })

  it('selects all transferred assets only when a system fee asset is attached', async () => {
    const spy = vi.spyOn(mockDestApi, 'getXcmPaymentApiFee')

    await callFor(snowbridgeAsset, true)
    const withSystemAsset = spy.mock.calls[0][1] as Record<string, Record<string, never>[]>
    expect(withSystemAsset[version][5]).toEqual({
      DepositAsset: {
        assets: { Wild: { AllOf: { id: snowbridgeAsset.location, fun: 'Fungible' } } },
        beneficiary: mockBeneficiary
      }
    })

    spy.mockClear()
    await callFor(nativeRelayAsset, false)
    const withoutSystemAsset = spy.mock.calls[0][1] as Record<string, Record<string, never>[]>
    expect(withoutSystemAsset[version][4]).toEqual({
      DepositAsset: {
        assets: { Wild: { AllCounted: 1 } },
        beneficiary: mockBeneficiary
      }
    })

    expect(createAsset).toHaveBeenCalledWith(version, MIN_AMOUNT, RELAY_LOCATION)
    expect(createBeneficiaryLocation).toHaveBeenCalledWith({
      api: mockDestApi,
      address: recipient,
      version
    })
  })
})
