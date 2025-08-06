import type { TMultiLocation, Version } from '@paraspell/sdk-common'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedApiCall,
  TTypeAndThenCallContext
} from '../../types'
import { createTypeAndThenCall } from './createTypeAndThenCall'

vi.mock('./createContext', () => ({
  createTypeAndThenCallContext: vi.fn()
}))

vi.mock('./createCustomXcm', () => ({
  createCustomXcm: vi.fn()
}))

vi.mock('./utils', () => ({
  createRefundInstruction: vi.fn()
}))

vi.mock('./computeFees', () => ({
  computeAllFees: vi.fn()
}))

vi.mock('./buildTypeAndThenCall', () => ({
  buildTypeAndThenCall: vi.fn()
}))

vi.mock('../../utils', () => ({
  createMultiAsset: vi.fn()
}))

import type { TMultiAsset } from '@paraspell/assets'

import { createMultiAsset } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'
import { createRefundInstruction } from './utils'

describe('createTypeAndThenCall', () => {
  const mockApi = {}
  const mockChain = 'Polkadot' as TNodeDotKsmWithRelayChains
  const mockVersion = 'V3' as Version
  const mockSenderAddress = '0x123'
  const mockSerializedCall = {
    module: 'PolkadotXcm',
    method: 'mockMethod',
    parameters: {}
  } as TSerializedApiCall
  const mockCustomXcm = { xcm: 'custom' } as unknown as ReturnType<typeof createCustomXcm>
  const mockRefundInstruction = { refund: 'instruction' } as unknown as ReturnType<
    typeof createRefundInstruction
  >
  const mockMultiAsset = { id: {} as TMultiLocation, fun: { Fungible: 1000n } } as TMultiAsset

  const mockFees = {
    reserveFee: 100n,
    destFee: 200n,
    refundFee: 50n
  } as Awaited<ReturnType<typeof computeAllFees>>

  const mockContext = {
    asset: {
      amount: 1000n,
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } }
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(mockContext)
    vi.mocked(createCustomXcm).mockReturnValue(mockCustomXcm)
    vi.mocked(createRefundInstruction).mockReturnValue(mockRefundInstruction)
    vi.mocked(computeAllFees).mockResolvedValue(mockFees)
    vi.mocked(buildTypeAndThenCall).mockReturnValue(mockSerializedCall)
    vi.mocked(createMultiAsset).mockReturnValue(mockMultiAsset)
  })

  it('should handle DOT asset with RELAY_LOCATION', async () => {
    const dotContext = {
      ...mockContext,
      asset: {
        ...mockContext.asset,
        multiLocation: RELAY_LOCATION
      }
    } as TTypeAndThenCallContext<unknown, unknown>
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(dotContext)

    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await createTypeAndThenCall(mockChain, options)

    expect(result).toBe(mockSerializedCall)

    expect(createRefundInstruction).toHaveBeenCalledWith(mockApi, mockSenderAddress, mockVersion)

    expect(computeAllFees).toHaveBeenCalledWith(
      dotContext,
      mockCustomXcm,
      true,
      mockRefundInstruction
    )

    expect(createMultiAsset).toHaveBeenCalledTimes(1)
    expect(createMultiAsset).toHaveBeenCalledWith(mockVersion, 1000n, RELAY_LOCATION)

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      dotContext,
      true,
      [mockRefundInstruction, mockCustomXcm],
      [mockMultiAsset]
    )
  })

  it('should handle DOT asset with Kusama GlobalConsensus location', async () => {
    const kusamaLocation = {
      parents: 2,
      interior: {
        X1: [
          {
            GlobalConsensus: {
              Kusama: null
            }
          }
        ]
      }
    }

    const kusamaContext = {
      ...mockContext,
      asset: {
        ...mockContext.asset,
        multiLocation: kusamaLocation
      }
    } as TTypeAndThenCallContext<unknown, unknown>
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(kusamaContext)

    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await createTypeAndThenCall(mockChain, options)

    expect(result).toBe(mockSerializedCall)

    expect(computeAllFees).toHaveBeenCalledWith(
      kusamaContext,
      mockCustomXcm,
      true,
      mockRefundInstruction
    )

    expect(createMultiAsset).toHaveBeenCalledTimes(1)
  })

  it('should handle non-DOT asset', async () => {
    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await createTypeAndThenCall(mockChain, options)

    expect(result).toBe(mockSerializedCall)

    expect(computeAllFees).toHaveBeenCalledWith(
      mockContext,
      mockCustomXcm,
      false,
      mockRefundInstruction
    )

    expect(createMultiAsset).toHaveBeenCalledTimes(2)

    expect(createMultiAsset).toHaveBeenNthCalledWith(1, mockVersion, 350n, RELAY_LOCATION)

    expect(createMultiAsset).toHaveBeenNthCalledWith(
      2,
      mockVersion,
      1000n,
      mockContext.asset.multiLocation
    )

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      mockContext,
      false,
      [mockRefundInstruction, mockCustomXcm],
      [mockMultiAsset, mockMultiAsset]
    )
  })

  it('should handle missing senderAddress (no refund instruction)', async () => {
    const options = {
      api: mockApi,
      senderAddress: undefined,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await createTypeAndThenCall(mockChain, options)

    expect(result).toBe(mockSerializedCall)

    expect(createRefundInstruction).not.toHaveBeenCalled()

    expect(computeAllFees).toHaveBeenCalledWith(mockContext, mockCustomXcm, false, null)

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      mockContext,
      false,
      [mockCustomXcm],
      expect.any(Array)
    )
  })

  it('should correctly calculate total fee', async () => {
    const customFees = {
      ...mockFees,
      reserveFee: 1000n,
      destFee: 2000n,
      refundFee: 500n
    } as Awaited<ReturnType<typeof computeAllFees>>
    vi.mocked(computeAllFees).mockResolvedValue(customFees)

    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await createTypeAndThenCall(mockChain, options)

    expect(createMultiAsset).toHaveBeenNthCalledWith(1, mockVersion, 3500n, RELAY_LOCATION)
  })

  it('should create custom XCM twice with correct parameters', async () => {
    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await createTypeAndThenCall(mockChain, options)

    expect(createCustomXcm).toHaveBeenCalledTimes(2)

    expect(createCustomXcm).toHaveBeenNthCalledWith(1, mockContext, false)

    expect(createCustomXcm).toHaveBeenNthCalledWith(2, mockContext, false, mockFees)
  })
})
