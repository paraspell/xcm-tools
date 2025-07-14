import type { TAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, findAssetOnDestOrThrow } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { InvalidParameterError } from '../../errors'
import { getTNode } from '../../nodes/getTNode'
import type { HopTraversalConfig } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getParaEthTransferFees } from '../ethTransfer'
import { addEthereumBridgeFees, traverseXcmHops } from './traverseXcmHops'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  findAssetOnDestOrThrow: vi.fn()
}))

vi.mock('../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../../utils', () => ({
  getRelayChainOf: vi.fn()
}))

vi.mock('../ethTransfer', () => ({
  getParaEthTransferFees: vi.fn()
}))

vi.mock('../../constants', () => ({
  DRY_RUN_CLIENT_TIMEOUT_MS: 300000
}))

describe('traverseXcmHops', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockProcessHop: ReturnType<typeof vi.fn>
  let mockShouldContinue: ReturnType<typeof vi.fn>
  let mockExtractNextHopData: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockApi = {
      getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() }),
      clone: vi.fn(),
      init: vi.fn(),
      disconnect: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)

    mockProcessHop = vi.fn()
    mockShouldContinue = vi.fn().mockReturnValue(true)
    mockExtractNextHopData = vi.fn()

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ assetId: 'asset1' } as TAsset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ assetId: 'asset2' } as TAsset)
  })

  it('should process a single hop successfully', async () => {
    const forwardedXcms = [[], [{ value: ['some-data'] }]]
    const destParaId = 1000

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')

    mockProcessHop.mockResolvedValue({
      fee: 1000n,
      xcmData: 'processed'
    })

    mockExtractNextHopData.mockReturnValue({
      forwardedXcms: [[], []],
      destParaId: undefined
    })

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      api: mockApi,
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: destParaId,
      processHop: mockProcessHop,
      shouldContinue: mockShouldContinue,
      extractNextHopData: mockExtractNextHopData
    }

    const initSpy = vi.spyOn(mockApi, 'init')

    const result = await traverseXcmHops(config)

    expect(result).toEqual({
      hops: [],
      destination: { fee: 1000n, xcmData: 'processed' },
      lastProcessedChain: 'AssetHubPolkadot'
    })

    expect(initSpy).toHaveBeenCalledWith('AssetHubPolkadot', 300000)
    expect(mockProcessHop).toHaveBeenCalledWith({
      api: mockApi,
      currentChain: 'AssetHubPolkadot',
      currentOrigin: 'Polkadot',
      currentAsset: { assetId: 'asset1' },
      forwardedXcms,
      hasPassedExchange: false,
      isDestination: true,
      isAssetHub: true,
      isBridgeHub: false
    })
  })

  it('should process multiple hops with exchange', async () => {
    const forwardedXcms1 = [[], [{ value: ['data1'] }]]
    const forwardedXcms2 = [[], [{ value: ['data2'] }]]
    const forwardedXcms3 = [[], [{ value: ['data3'] }]]

    vi.mocked(getTNode)
      .mockReturnValueOnce('BridgeHubPolkadot')
      .mockReturnValueOnce('Hydration')
      .mockReturnValueOnce('AssetHubPolkadot')

    const hopResult1 = { fee: 1000n, hop: 1 }
    const hopResult2 = { fee: 2000n, hop: 2 }
    const hopResult3 = { fee: 3000n, hop: 3 }

    mockProcessHop
      .mockResolvedValueOnce(hopResult1)
      .mockResolvedValueOnce(hopResult2)
      .mockResolvedValueOnce(hopResult3)

    mockExtractNextHopData
      .mockReturnValueOnce({ forwardedXcms: forwardedXcms2, destParaId: 2000 })
      .mockReturnValueOnce({ forwardedXcms: forwardedXcms3, destParaId: 3000 })
      .mockReturnValueOnce({ forwardedXcms: [[], []], destParaId: undefined })

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      api: mockApi,
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms1,
      initialDestParaId: 1000,
      swapConfig: {
        exchangeChain: 'Hydration' as TNodeDotKsmWithRelayChains,
        currencyTo: { id: 'USDT' }
      },
      processHop: mockProcessHop,
      shouldContinue: mockShouldContinue,
      extractNextHopData: mockExtractNextHopData
    }

    const result = await traverseXcmHops(config)

    expect(result).toEqual({
      hops: [
        { chain: 'BridgeHubPolkadot', result: hopResult1 },
        { chain: 'Hydration', result: hopResult2 }
      ],
      bridgeHub: hopResult1,
      destination: hopResult3,
      lastProcessedChain: 'AssetHubPolkadot'
    })

    expect(mockProcessHop).toHaveBeenCalledTimes(3)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessHop.mock.calls[1][0].hasPassedExchange).toBe(false)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockProcessHop.mock.calls[2][0].hasPassedExchange).toBe(true)
  })

  it('should throw error when getTNode returns null', async () => {
    const forwardedXcms = [[], [{ value: ['data'] }]]

    vi.mocked(getTNode).mockReturnValue(null)

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      api: mockApi,
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: 1000,
      processHop: mockProcessHop,
      shouldContinue: mockShouldContinue,
      extractNextHopData: mockExtractNextHopData
    }

    await expect(traverseXcmHops(config)).rejects.toThrow(
      new InvalidParameterError('Unable to find TNode for paraId 1000')
    )
  })

  it('should stop processing when shouldContinue returns false', async () => {
    const forwardedXcms = [[], [{ value: ['data'] }]]

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')
    mockProcessHop.mockResolvedValue({ fee: 1000n })
    mockShouldContinue.mockReturnValue(false)

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      api: mockApi,
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'Acala' as TNodeDotKsmWithRelayChains,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: 1000,
      processHop: mockProcessHop,
      shouldContinue: mockShouldContinue,
      extractNextHopData: mockExtractNextHopData
    }

    const result = await traverseXcmHops(config)

    expect(result.hops).toHaveLength(1)
    expect(mockExtractNextHopData).not.toHaveBeenCalled()
  })

  it('should handle empty forwardedXcms', async () => {
    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      api: mockApi,
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      currency: { id: 'DOT' },
      initialForwardedXcms: [[], []],
      initialDestParaId: 1000,
      processHop: mockProcessHop,
      shouldContinue: mockShouldContinue,
      extractNextHopData: mockExtractNextHopData
    }

    const result = await traverseXcmHops(config)

    expect(result).toEqual({
      hops: [],
      lastProcessedChain: 'Polkadot'
    })
    expect(mockProcessHop).not.toHaveBeenCalled()
  })

  it('should always disconnect api after processing', async () => {
    const forwardedXcms = [[], [{ value: ['data'] }]]

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')
    mockProcessHop.mockRejectedValue(new Error('Processing failed'))

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      api: mockApi,
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: 1000,
      processHop: mockProcessHop,
      shouldContinue: mockShouldContinue,
      extractNextHopData: mockExtractNextHopData
    }

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await expect(traverseXcmHops(config)).rejects.toThrow('Processing failed')
    expect(disconnectSpy).toHaveBeenCalled()
  })
})

describe('addEthereumBridgeFees', () => {
  let mockApi: IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    mockApi = {
      clone: vi.fn(),
      init: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)

    vi.mocked(getParaEthTransferFees).mockResolvedValue([3000n, 3000n])
  })

  it('should add Ethereum bridge fees when destination is Ethereum', async () => {
    const bridgeHubResult = { fee: 5000n, data: 'test' }
    const bridgeFee = 3000n

    vi.mocked(getParaEthTransferFees).mockResolvedValue([bridgeFee, bridgeFee])

    const initSpy = vi.spyOn(mockApi, 'init').mockResolvedValue(undefined)

    const result = await addEthereumBridgeFees(
      mockApi,
      bridgeHubResult,
      'Ethereum',
      'AssetHubPolkadot' as TNodeDotKsmWithRelayChains
    )

    expect(result).toEqual({
      fee: 8000n,
      data: 'test'
    })
    expect(initSpy).toHaveBeenCalledWith('AssetHubPolkadot', 300000)
    expect(getParaEthTransferFees).toHaveBeenCalledWith(mockApi)
  })

  it('should return original result when destination is not Ethereum', async () => {
    const bridgeHubResult = { fee: 5000n, data: 'test' }

    const initSpy = vi.spyOn(mockApi, 'init')

    const result = await addEthereumBridgeFees(
      mockApi,
      bridgeHubResult,
      'Acala',
      'AssetHubPolkadot' as TNodeDotKsmWithRelayChains
    )

    expect(result).toBe(bridgeHubResult)
    expect(initSpy).not.toHaveBeenCalled()
  })

  it('should return undefined when bridgeHubResult is undefined', async () => {
    const initSpy = vi.spyOn(mockApi, 'init')

    const result = await addEthereumBridgeFees(
      mockApi,
      undefined,
      'Ethereum',
      'AssetHubPolkadot' as TNodeDotKsmWithRelayChains
    )

    expect(result).toBeUndefined()
    expect(initSpy).not.toHaveBeenCalled()
  })
})
