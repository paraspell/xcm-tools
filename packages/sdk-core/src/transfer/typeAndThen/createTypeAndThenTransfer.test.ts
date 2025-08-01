import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DryRunFailedError, InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type { TDryRunResult, TPolkadotXCMTransferOptions } from '../../types'
import { assertAddressIsString, assertHasLocation, getRelayChainOf } from '../../utils'
import { getAssetReserveChain } from '../../utils/transfer/execute/getAssetReserveChain'
import { dryRunInternal } from '../dryRun/dryRunInternal'
import { padFeeBy } from '../fees'
import { createTypeAndThenCall } from './createTypeAndThenCall'
import { createTypeAndThenTransfer } from './createTypeAndThenTransfer'

vi.mock('../../nodes/getTNode')
vi.mock('../../utils')
vi.mock('../../utils/transfer/execute/getAssetReserveChain')
vi.mock('../dryRun/dryRunInternal')
vi.mock('../fees')
vi.mock('./createTypeAndThenCall')

describe('createTypeAndThenTransfer', () => {
  const mockApi = {
    callTxMethod: vi.fn().mockReturnValue('mocked-tx')
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api: mockApi,
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    senderAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    paraIdTo: 2000,
    currency: { symbol: 'DOT', amount: 1000000000000n },
    asset: {
      symbol: 'DOT',
      amount: 1000000000000n,
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } }
    },
    version: 'V3',
    destination: 'destination-value' as TNodeWithRelayChains
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockDryRunSuccess = {
    origin: { success: true },
    hops: [
      {
        chain: 'Kusama',
        result: { success: true, fee: 5000n }
      }
    ],
    failureReason: null
  } as unknown as TDryRunResult

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTNode).mockReturnValue('Acala')
    vi.mocked(getAssetReserveChain).mockReturnValue('AssetHubPolkadot')
    vi.mocked(createTypeAndThenCall).mockReturnValue({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {}
    })
    vi.mocked(dryRunInternal).mockResolvedValue(mockDryRunSuccess)
    vi.mocked(padFeeBy).mockReturnValue(7000n)
  })

  it('should throw error when senderAddress is missing', async () => {
    const inputWithoutSender = { ...mockInput, senderAddress: undefined }

    await expect(
      createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, inputWithoutSender)
    ).rejects.toThrow(InvalidParameterError)
    await expect(
      createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, inputWithoutSender)
    ).rejects.toThrow('Please provide senderAddress')
  })

  it('should return call without dry run when chain equals reserveChain', async () => {
    vi.mocked(getAssetReserveChain).mockReturnValue('Polkadot')

    const result = await createTypeAndThenTransfer(
      'Polkadot' as TNodeDotKsmWithRelayChains,
      mockInput
    )

    expect(dryRunInternal).not.toHaveBeenCalled()
    expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
    expect(createTypeAndThenCall).toHaveBeenCalledWith(
      'Polkadot',
      'Acala',
      'Polkadot',
      mockInput,
      1000n // MIN_FEE
    )
    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {}
    })
  })

  it('should return call without dry run when destChain equals reserveChain', async () => {
    vi.mocked(getAssetReserveChain).mockReturnValue('Acala')

    await createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)

    expect(dryRunInternal).not.toHaveBeenCalled()
    expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
    expect(createTypeAndThenCall).toHaveBeenCalledWith(
      'Polkadot',
      'Acala',
      'Acala',
      mockInput,
      1000n // MIN_FEE
    )
  })

  it('should perform dry run when neither chain equals reserveChain', async () => {
    await createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)

    expect(dryRunInternal).toHaveBeenCalledWith({
      api: mockApi,
      tx: 'mocked-tx',
      origin: 'Polkadot',
      destination: 'Acala',
      senderAddress: mockInput.senderAddress,
      address: mockInput.address,
      currency: mockInput.currency
    })
    expect(padFeeBy).toHaveBeenCalledWith(5000n, 40)
    expect(createTypeAndThenCall).toHaveBeenCalledTimes(2)
    expect(createTypeAndThenCall).toHaveBeenLastCalledWith(
      'Polkadot',
      'Acala',
      'AssetHubPolkadot',
      mockInput,
      7000n
    )
  })

  it('should throw error when dry run origin fails', async () => {
    vi.mocked(dryRunInternal).mockResolvedValue({
      origin: { success: false },
      failureReason: 'Insufficient balance',
      hops: []
    } as unknown as TDryRunResult)

    await expect(
      createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)
    ).rejects.toThrow(DryRunFailedError)
    await expect(
      createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)
    ).rejects.toThrow('Insufficient balance')
  })

  it('should throw error when hop fails', async () => {
    vi.mocked(dryRunInternal).mockResolvedValue({
      origin: { success: true },
      hops: [
        {
          chain: 'AssetHub',
          result: {
            success: false,
            failureReason: 'Asset not found'
          }
        }
      ],
      failureReason: null
    } as unknown as TDryRunResult)

    await expect(
      createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)
    ).rejects.toThrow(DryRunFailedError)
    await expect(
      createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)
    ).rejects.toThrow('Dry run failed on an intermediate hop (AssetHub). Reason: Asset not found')
  })

  it('should use MIN_FEE when no hops are present', async () => {
    vi.mocked(dryRunInternal).mockResolvedValue({
      origin: { success: true },
      hops: [],
      failureReason: null
    } as unknown as TDryRunResult)

    await createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)

    expect(padFeeBy).toHaveBeenCalledWith(1000n, 40) // MIN_FEE
  })

  it('should call assertion functions', async () => {
    await createTypeAndThenTransfer('Polkadot' as TNodeDotKsmWithRelayChains, mockInput)

    expect(assertHasLocation).toHaveBeenCalledWith(mockInput.asset)
    expect(assertAddressIsString).toHaveBeenCalledWith(mockInput.address)
  })

  it('should get correct destination chain', async () => {
    await createTypeAndThenTransfer('Kusama' as TNodeDotKsmWithRelayChains, mockInput)

    expect(getRelayChainOf).toHaveBeenCalledWith('Kusama')
    expect(getTNode).toHaveBeenCalledWith(2000, 'polkadot')
  })
})
