import type { TAsset, TAssetInfo } from '@paraspell/assets'
import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import type { TSerializedExtrinsics, TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { createAsset, getRelayChainOf, localizeLocation, parseUnits, sortAssets } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'
import { constructTypeAndThenCall, createTypeAndThenCall } from './createTypeAndThenCall'
import { createRefundInstruction } from './utils'

vi.mock('@paraspell/assets')

vi.mock('./createContext')
vi.mock('./createCustomXcm')
vi.mock('./utils')
vi.mock('./computeFees')
vi.mock('./buildTypeAndThenCall')
vi.mock('../../utils')

describe('createTypeAndThenCall', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockChain: TSubstrateChain = 'Polkadot'
  const mockVersion = Version.V5
  const mockSenderAddress = '0x123'
  const mockSerializedCall: TSerializedExtrinsics = {
    module: 'PolkadotXcm',
    method: 'mockMethod',
    params: {}
  }
  const mockCustomXcm: ReturnType<typeof createCustomXcm> = []
  const mockRefundInstruction: ReturnType<typeof createRefundInstruction> = { SetAppendix: [] }
  const mockAsset: TAsset = { id: RELAY_LOCATION, fun: { Fungible: 1000n } }
  const mockSystemAsset: TAssetInfo = {
    symbol: 'DOT',
    decimals: 12,
    location: RELAY_LOCATION
  }

  const mockFees: TTypeAndThenFees = {
    hopFees: 100n,
    destFee: 200n
  }

  const mockContext = {
    origin: { api: mockApi, chain: mockChain },
    dest: { api: mockApi, chain: mockChain },
    reserve: { api: mockApi, chain: mockChain },
    isSubBridge: false,
    isRelayAsset: false,
    assetInfo: {
      amount: 1000n,
      decimals: 12,
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
    },
    systemAsset: mockSystemAsset,
    options: {
      api: mockApi,
      senderAddress: mockSenderAddress,
      address: 'dest-address',
      version: mockVersion,
      currency: { amount: 1000n },
      feeCurrency: undefined
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.deserializeExtrinsics = vi.fn()
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(mockContext)
    vi.mocked(createCustomXcm).mockReturnValue(mockCustomXcm)
    vi.mocked(createRefundInstruction).mockReturnValue(mockRefundInstruction)
    vi.mocked(computeAllFees).mockResolvedValue(mockFees)
    vi.mocked(buildTypeAndThenCall).mockReturnValue(mockSerializedCall)
    vi.mocked(createAsset).mockReturnValue(mockAsset)
    vi.mocked(localizeLocation).mockImplementation((_, location) => location)
    vi.mocked(parseUnits).mockImplementation(value => BigInt(value.toString()))
    vi.mocked(getRelayChainOf).mockReturnValue(mockChain)
    vi.mocked(sortAssets).mockImplementation(assets => assets)
  })

  it('should handle DOT asset with RELAY_LOCATION', async () => {
    const dotContext = {
      ...mockContext,
      isRelayAsset: true,
      assetInfo: {
        ...mockContext.assetInfo,
        location: RELAY_LOCATION
      }
    }
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(dotContext)

    const result = await createTypeAndThenCall(mockChain, mockContext.options)

    expect(result).toBe(mockSerializedCall)

    expect(createRefundInstruction).toHaveBeenCalledWith(mockApi, mockSenderAddress, mockVersion, 1)

    expect(computeAllFees).toHaveBeenCalledWith(dotContext, expect.any(Function))

    expect(createAsset).toHaveBeenCalledTimes(1)
    expect(createAsset).toHaveBeenCalledWith(mockVersion, 1000n, RELAY_LOCATION)

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      dotContext,
      true,
      [mockRefundInstruction, ...mockCustomXcm],
      [mockAsset]
    )

    expect(createCustomXcm).toHaveBeenCalledWith(
      dotContext,
      1,
      false,
      mockFees.destFee + mockFees.hopFees,
      mockFees
    )
    expect(createCustomXcm).toHaveBeenCalledTimes(1)
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
      isRelayAsset: true,
      assetInfo: {
        ...mockContext.assetInfo,
        location: kusamaLocation
      }
    }
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(kusamaContext)

    const result = await createTypeAndThenCall(mockChain, mockContext.options)

    expect(result).toBe(mockSerializedCall)

    expect(computeAllFees).toHaveBeenCalledWith(kusamaContext, expect.any(Function))

    expect(createAsset).toHaveBeenCalledTimes(1)
  })

  it('should omit refund instruction when context is sub bridge', async () => {
    const subBridgeContext = {
      ...mockContext,
      isSubBridge: true
    }
    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(subBridgeContext)

    const result = await createTypeAndThenCall(mockChain, mockContext.options)

    expect(result).toBe(mockSerializedCall)

    expect(createRefundInstruction).toHaveBeenCalledWith(mockApi, mockSenderAddress, mockVersion, 2)

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(subBridgeContext, false, mockCustomXcm, [
      mockAsset,
      mockAsset
    ])
  })

  it('should handle missing senderAddress (no refund instruction)', async () => {
    const contextWithoutSender = {
      ...mockContext,
      options: {
        ...mockContext.options,
        senderAddress: undefined
      }
    }

    vi.mocked(createTypeAndThenCallContext).mockResolvedValue(contextWithoutSender)

    const options = {
      ...mockContext.options,
      senderAddress: undefined
    }

    const result = await createTypeAndThenCall(mockChain, options)

    expect(result).toBe(mockSerializedCall)

    expect(createRefundInstruction).not.toHaveBeenCalled()

    expect(computeAllFees).toHaveBeenCalledWith(contextWithoutSender, expect.any(Function))

    expect(buildTypeAndThenCall).toHaveBeenCalledWith(
      contextWithoutSender,
      false,
      mockCustomXcm,
      expect.any(Array)
    )
  })

  it('should correctly calculate total fee', async () => {
    const customFees: TTypeAndThenFees = {
      hopFees: 1000n,
      destFee: 2000n
    }

    vi.mocked(computeAllFees).mockResolvedValue(customFees)

    await createTypeAndThenCall(mockChain, mockContext.options)

    expect(createAsset).toHaveBeenNthCalledWith(1, mockVersion, 3000n, RELAY_LOCATION)
  })

  it('should build custom XCM with computed fees', async () => {
    await createTypeAndThenCall(mockChain, mockContext.options)

    expect(createCustomXcm).toHaveBeenCalledTimes(1)
    expect(createCustomXcm).toHaveBeenCalledWith(
      mockContext,
      2,
      false,
      mockFees.hopFees + mockFees.destFee,
      mockFees
    )
  })

  it('should resolve system asset amount when calculating fees', () => {
    const result = constructTypeAndThenCall(mockContext)

    expect(result).toBe(mockSerializedCall)
    expect(parseUnits).toHaveBeenCalledWith('1', 12)
    expect(createCustomXcm).toHaveBeenCalledWith(mockContext, 2, true, 1n, {
      hopFees: 0n,
      destFee: 0n
    })
  })

  it('should override amount relatively inside computeAllFees callback', async () => {
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(mockSystemAsset)
    vi.mocked(getRelayChainOf).mockReturnValue(mockChain)

    const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    await createTypeAndThenCall(mockChain, mockContext.options)

    const feeCallback = vi.mocked(computeAllFees).mock.calls[0][1]

    vi.mocked(createAsset).mockClear()
    vi.mocked(createCustomXcm).mockClear()
    vi.mocked(buildTypeAndThenCall).mockReturnValueOnce(mockSerializedCall)
    spy.mockResolvedValue('tx-result')

    const callbackResult = await feeCallback('5', true)

    expect(callbackResult).toBe('tx-result')
    expect(parseUnits).toHaveBeenCalledWith('5', 12)
    expect(createAsset).toHaveBeenNthCalledWith(1, mockVersion, 1n, RELAY_LOCATION)
    expect(createAsset).toHaveBeenNthCalledWith(
      2,
      mockVersion,
      1005n,
      mockContext.assetInfo.location
    )
    expect(spy).toHaveBeenCalledWith(mockSerializedCall)
  })
})
