import type { TAsset } from '@paraspell/assets'
import type { TLocation, TSubstrateChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedApiCall,
  TTypeAndThenCallContext
} from '../../types'
import { createAsset, localizeLocation } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'
import { createTypeAndThenCall } from './createTypeAndThenCall'
import { createRefundInstruction } from './utils'

vi.mock('./createContext')
vi.mock('./createCustomXcm')
vi.mock('./utils')
vi.mock('./computeFees')
vi.mock('./buildTypeAndThenCall')
vi.mock('../../utils')

describe('createTypeAndThenCall', () => {
  const mockApi = {}
  const mockChain: TSubstrateChain = 'Polkadot'
  const mockVersion = 'V3' as Version
  const mockSenderAddress = '0x123'
  const mockSerializedCall = {
    module: 'PolkadotXcm',
    method: 'mockMethod',
    parameters: {}
  } as TSerializedApiCall
  const mockCustomXcm = [{ xcm: 'custom' }] as unknown as ReturnType<typeof createCustomXcm>
  const mockRefundInstruction = { refund: 'instruction' } as unknown as ReturnType<
    typeof createRefundInstruction
  >
  const mockAsset = { id: {} as TLocation, fun: { Fungible: 1000n } } as TAsset

  const mockFees = {
    reserveFee: 100n,
    destFee: 200n,
    refundFee: 50n
  } as Awaited<ReturnType<typeof computeAllFees>>

  const mockContext = {
    origin: { api: {} as unknown, chain: mockChain } as TTypeAndThenCallContext<
      unknown,
      unknown
    >['origin'],
    dest: { api: {} as unknown, chain: mockChain } as TTypeAndThenCallContext<
      unknown,
      unknown
    >['dest'],
    reserve: { api: {} as unknown, chain: mockChain } as TTypeAndThenCallContext<
      unknown,
      unknown
    >['reserve'],
    isSubBridge: false,
    assetInfo: {
      amount: 1000n,
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
    },
    options: {} as TPolkadotXCMTransferOptions<unknown, unknown>
  } as TTypeAndThenCallContext<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(mockContext)
    vi.mocked(createCustomXcm).mockReturnValue(mockCustomXcm)
    vi.mocked(createRefundInstruction).mockReturnValue(mockRefundInstruction)
    vi.mocked(computeAllFees).mockResolvedValue(mockFees)
    vi.mocked(buildTypeAndThenCall).mockReturnValue(mockSerializedCall)
    vi.mocked(createAsset).mockReturnValue(mockAsset)
    vi.mocked(localizeLocation).mockImplementation((_, location) => location)
  })

  it('should handle DOT asset with RELAY_LOCATION', async () => {
    const dotContext = {
      ...mockContext,
      assetInfo: {
        ...mockContext.assetInfo,
        location: RELAY_LOCATION
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

    expect(createCustomXcm).toHaveBeenNthCalledWith(1, dotContext, true, 1, true)

    expect(createRefundInstruction).toHaveBeenCalledWith(mockApi, mockSenderAddress, mockVersion, 1)

    expect(computeAllFees).toHaveBeenCalledWith(
      dotContext,
      mockCustomXcm,
      true,
      mockRefundInstruction
    )

    expect(createAsset).toHaveBeenCalledTimes(1)
    expect(createAsset).toHaveBeenCalledWith(mockVersion, 1000n, RELAY_LOCATION)

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      dotContext,
      true,
      [mockRefundInstruction, ...mockCustomXcm],
      [mockAsset]
    )

    expect(createCustomXcm).toHaveBeenNthCalledWith(2, dotContext, true, 1, false, mockFees)
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
      assetInfo: {
        ...mockContext.assetInfo,
        location: kusamaLocation
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

    expect(createAsset).toHaveBeenCalledTimes(1)
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

    expect(createAsset).toHaveBeenCalledTimes(2)

    expect(createAsset).toHaveBeenNthCalledWith(1, mockVersion, 350n, RELAY_LOCATION)

    expect(createAsset).toHaveBeenNthCalledWith(
      2,
      mockVersion,
      1000n,
      mockContext.assetInfo.location
    )

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      mockContext,
      false,
      [mockRefundInstruction, ...mockCustomXcm],
      [mockAsset, mockAsset]
    )
  })

  it('should omit refund instruction when context is sub bridge', async () => {
    const subBridgeContext = {
      ...mockContext,
      isSubBridge: true
    }
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(subBridgeContext)

    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await createTypeAndThenCall(mockChain, options)

    expect(result).toBe(mockSerializedCall)

    expect(createRefundInstruction).toHaveBeenCalledWith(mockApi, mockSenderAddress, mockVersion, 2)

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(subBridgeContext, false, mockCustomXcm, [
      mockAsset,
      mockAsset
    ])
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
      mockCustomXcm,
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

    expect(createAsset).toHaveBeenNthCalledWith(1, mockVersion, 3500n, RELAY_LOCATION)
  })

  it('should create custom XCM twice with correct parameters', async () => {
    const options = {
      api: mockApi,
      senderAddress: mockSenderAddress,
      version: mockVersion
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await createTypeAndThenCall(mockChain, options)

    expect(createCustomXcm).toHaveBeenCalledTimes(2)

    expect(createCustomXcm).toHaveBeenNthCalledWith(1, mockContext, false, 2, true)

    expect(createCustomXcm).toHaveBeenNthCalledWith(2, mockContext, false, 2, false, mockFees)
  })
})
