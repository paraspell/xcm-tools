import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, findAssetOnDestOrThrow } from '@paraspell/assets'
import type { TChain, TParachain, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getTChain } from '../../chains/getTChain'
import { InvalidParameterError } from '../../errors'
import type { HopTraversalConfig } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getParaEthTransferFees } from '../eth-transfer'
import { addEthereumBridgeFees, traverseXcmHops } from './traverseXcmHops'

vi.mock('@paraspell/assets')
vi.mock('../../chains/getTChain')
vi.mock('../../utils')
vi.mock('../eth-transfer')
vi.mock('../../constants', () => ({
  DRY_RUN_CLIENT_TIMEOUT_MS: 300000
}))

describe('traverseXcmHops', () => {
  let mockApi: IPolkadotApi<unknown, unknown>

  const baseConfig = {
    processHop: vi.fn(),
    shouldContinue: vi.fn().mockReturnValue(true),
    extractNextHopData: vi.fn()
  } as unknown as HopTraversalConfig<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    mockApi = {
      getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() }),
      clone: vi.fn(),
      init: vi.fn(),
      disconnect: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ assetId: 'asset1' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ assetId: 'asset2' } as TAssetInfo)
  })

  it('should process a single hop successfully', async () => {
    const forwardedXcms = [[], [{ value: ['some-data'] }]]
    const destParaId = 1000

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      ...baseConfig,
      api: mockApi,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'AssetHubPolkadot' as TChain,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: destParaId
    }

    vi.mocked(getTChain).mockReturnValue('AssetHubPolkadot')

    vi.spyOn(config, 'processHop').mockResolvedValue({
      fee: 1000n,
      xcmData: 'processed'
    })

    vi.spyOn(config, 'extractNextHopData').mockReturnValue({
      forwardedXcms: [[], []],
      destParaId: undefined
    })

    const initSpy = vi.spyOn(mockApi, 'init')
    const processHopSpy = vi.spyOn(config, 'processHop')

    const result = await traverseXcmHops(config)

    expect(result).toEqual({
      hops: [],
      destination: { fee: 1000n, xcmData: 'processed' },
      lastProcessedChain: 'AssetHubPolkadot'
    })

    expect(initSpy).toHaveBeenCalledWith('AssetHubPolkadot', 300000)
    expect(processHopSpy).toHaveBeenCalledWith({
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

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      ...baseConfig,
      api: mockApi,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'AssetHubPolkadot' as TChain,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms1,
      initialDestParaId: 1000,
      swapConfig: {
        exchangeChain: 'Hydration' as TParachain,
        currencyTo: { id: 'USDT' }
      }
    }

    vi.mocked(getTChain)
      .mockReturnValueOnce('BridgeHubPolkadot')
      .mockReturnValueOnce('Hydration')
      .mockReturnValueOnce('AssetHubPolkadot')

    const hopResult1 = { fee: 1000n, hop: 1 }
    const hopResult2 = { fee: 2000n, hop: 2 }
    const hopResult3 = { fee: 3000n, hop: 3 }

    const processHopSpy = vi
      .spyOn(config, 'processHop')
      .mockResolvedValueOnce(hopResult1)
      .mockResolvedValueOnce(hopResult2)
      .mockResolvedValueOnce(hopResult3)

    vi.spyOn(config, 'extractNextHopData')
      .mockReturnValueOnce({ forwardedXcms: forwardedXcms2, destParaId: 2000 })
      .mockReturnValueOnce({ forwardedXcms: forwardedXcms3, destParaId: 3000 })
      .mockReturnValueOnce({ forwardedXcms: [[], []], destParaId: undefined })

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

    expect(processHopSpy).toHaveBeenCalledTimes(3)
    expect(processHopSpy.mock.calls[1][0].hasPassedExchange).toBe(false)
    expect(processHopSpy.mock.calls[2][0].hasPassedExchange).toBe(true)
  })

  it('should throw error when getTChain returns null', async () => {
    const forwardedXcms = [[], [{ value: ['data'] }]]

    vi.mocked(getTChain).mockReturnValue(null)

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      ...baseConfig,
      api: mockApi,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'AssetHubPolkadot' as TChain,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: 1000
    }

    await expect(traverseXcmHops(config)).rejects.toThrow(
      new InvalidParameterError('Unable to find TChain for paraId 1000')
    )
  })

  it('should stop processing when shouldContinue returns false', async () => {
    const forwardedXcms = [[], [{ value: ['data'] }]]

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      ...baseConfig,
      api: mockApi,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'Acala' as TChain,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: 1000
    }

    vi.mocked(getTChain).mockReturnValue('AssetHubPolkadot')

    vi.spyOn(config, 'processHop').mockResolvedValue({ fee: 1000n })
    vi.spyOn(config, 'shouldContinue').mockReturnValue(false)

    const extractSpy = vi.spyOn(config, 'extractNextHopData')

    const result = await traverseXcmHops(config)

    expect(result.hops).toHaveLength(1)
    expect(extractSpy).not.toHaveBeenCalled()
  })

  it('should handle empty forwardedXcms', async () => {
    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      ...baseConfig,
      api: mockApi,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'AssetHubPolkadot' as TChain,
      currency: { id: 'DOT' },
      initialForwardedXcms: [[], []],
      initialDestParaId: 1000
    }

    const processHopSpy = vi.spyOn(config, 'processHop')

    const result = await traverseXcmHops(config)

    expect(result).toEqual({
      hops: [],
      lastProcessedChain: 'Polkadot'
    })
    expect(processHopSpy).not.toHaveBeenCalled()
  })

  it('should always disconnect api after processing', async () => {
    const forwardedXcms = [[], [{ value: ['data'] }]]

    const config: HopTraversalConfig<unknown, unknown, unknown> = {
      ...baseConfig,
      api: mockApi,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'AssetHubPolkadot' as TChain,
      currency: { id: 'DOT' },
      initialForwardedXcms: forwardedXcms,
      initialDestParaId: 1000
    }

    vi.mocked(getTChain).mockReturnValue('AssetHubPolkadot')
    vi.spyOn(config, 'processHop').mockRejectedValue(new Error('Processing failed'))

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
      'AssetHubPolkadot' as TSubstrateChain
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
      'AssetHubPolkadot' as TSubstrateChain
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
      'AssetHubPolkadot' as TSubstrateChain
    )

    expect(result).toBeUndefined()
    expect(initSpy).not.toHaveBeenCalled()
  })
})
